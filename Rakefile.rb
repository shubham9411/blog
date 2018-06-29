require "rubygems"
require "bundler/setup"
require "stringex"
require 'yaml'

## -- Config -- ##

draft_posts_dir = "_drafts"    # directory for blog files
posts_dir       = "_posts"     # directory for blog files
new_post_ext    = "md"         # default new post file extension when using the new_post task
new_page_ext    = "md"         # default new page file extension when using the new_page task
category_list   = YAML.load_file('_data/categories.yml').map{|category| category['name']}


#############################
# Create a new Post or Page #
#############################

# usage rake new_post
desc "Create a new post in #{draft_posts_dir}"
task :new_post, :title do |t, args|
  if args.title
    title = args.title
  else
    title = get_stdin("Enter a title for your post: ")
  end
  filename = "#{draft_posts_dir}/#{title.to_url}.#{new_post_ext}"
  if File.exist?(filename)
    abort("rake aborted!") if ask("#{filename} already exists. Do you want to overwrite?", ['y', 'n']) == 'n'
  end
  category = ''
  while !category_list.include? category.downcase do
    category = get_stdin("Enter the category of the post, available categories are #{category_list}: ")
  end
  tags = get_stdin("Enter tags to classify your post (comma separated): ")
  puts "Creating new post: #{filename}"
  open(filename, 'w') do |post|
    post.puts "---"
    post.puts "layout: post"
    post.puts "title: \"#{title.gsub(/&/,'&amp;')}\""
    post.puts "tldr: "
    post.puts "modified: #{Time.now.strftime('%Y-%m-%d %H:%M:%S %z')}"
    post.puts "category: #{category}"
    post.puts "tags: [#{tags}]"
    post.puts "author: "
    post.puts "image:"
    post.puts "  feature: "
    post.puts "  credit: "
    post.puts "  creditlink: "
    post.puts "comments: "
    post.puts "share: "
    post.puts "---"
  end
end

# usage rake publish_post
desc "Publish a draft post from #{draft_posts_dir} to #{posts_dir}"
task :publish_post, :title do |t, args|
  drafts = Dir.entries(draft_posts_dir)
  drafts = drafts[2..drafts.size]
  drafts.each_index do |post_index|
    puts "#{post_index+1}. #{drafts.fetch(post_index)}"
  end

  post_to_publish = get_stdin("Select post to publish by its number: ")
  draft_post_file_name = File.join(draft_posts_dir,drafts.fetch(post_to_publish.to_i - 1))
  post_file_name = File.join(posts_dir,"#{Time.now.strftime('%Y-%m-%d')}-#{drafts.fetch(post_to_publish.to_i - 1)}")
  FileUtils.mv(draft_post_file_name, post_file_name)
  puts "Published #{post_file_name}"
end

# usage rake new_page
desc "Create a new page"
task :new_page, :title do |t, args|
  if args.title
    title = args.title
  else
    title = get_stdin("Enter a title for your page: ")
  end
  filename = "#{title.to_url}.#{new_page_ext}"
  if File.exist?(filename)
    abort("rake aborted!") if ask("#{filename} already exists. Do you want to overwrite?", ['y', 'n']) == 'n'
  end
  tags = get_stdin("Enter tags to classify your page (comma separated): ")
  puts "Creating new page: #{filename}"
  open(filename, 'w') do |page|
    page.puts "---"
    page.puts "layout: page"
    page.puts "permalink: /#{title.to_url}/"
    page.puts "title: \"#{title}\""
    post.puts "tldr: "
    page.puts "modified: #{Time.now.strftime('%Y-%m-%d %H:%M')}"
    page.puts "tags: [#{tags}]"
    page.puts "author: "
    page.puts "image:"
    page.puts "  feature: "
    page.puts "  credit: "
    page.puts "  creditlink: "
    page.puts "share: "
    page.puts "---"
  end
end

def get_stdin(message)
  print message
  STDIN.gets.chomp
end

def ask(message, valid_options)
  if valid_options
    answer = get_stdin("#{message} #{valid_options.to_s.gsub(/"/, '').gsub(/, /,'/')} ") while !valid_options.include?(answer)
  else
    answer = get_stdin(message)
  end
  answer
end