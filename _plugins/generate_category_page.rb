module Jekyll

  class CategoryPage < Page
    def initialize(site, base, dir, category, category_list)
      @site = site
      @base = base
      @dir = dir
      @name = 'index.html'

      self.process(@name)
      self.read_yaml(File.join(base, '_layouts'), 'categories.html')
      self.data['category_list'] = category_list
      category_title_prefix = site.config['category_title_prefix'] || 'Category: '
      self.data['title'] = category
      self.process(@name)
    end
  end

  class CategoryPageGenerator < Generator
    # safe true

    def generate(site)
      if site.layouts.key? 'categories'
        dir = site.config['category_dir'] || 'categories'
        site.categories.keys.each do |category|
        	category_list = []
        	site.categories[category].each do |post|
        		category_list << {'url' => post.url, 'title' => post.data['title'], 'date' => post.date}
        	end
          site.pages << CategoryPage.new(site, site.source, File.join(dir, category), category,category_list)
        end
      end
    end
  end

end