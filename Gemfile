source 'https://rubygems.org'

# -- We want to use the same environment for our local setup as
#    Github is using for GithubPages. So we first fetch version information from
#    https://pages.github.com/versions.json and use that version for our local
#    github-pages gem. When production changes, our bundler will start telling us
# require 'json'
require 'open-uri'
# versions = JSON.parse(open('https://pages.github.com/versions.json').read)
versions = {}
versions['github-pages'] = '133'

gem 'github-pages', versions['github-pages']
# This are auto included by github-pages gem. No need to mention them
# gem 'jekyll'
# gem 'kramdown'

# ---- Other gems
gem 'sanitize' # SanitizationFilter

gem 'stringex'
gem 'htmlentities'
gem 'coderay'

gem 'rake'
gem 'thor'
gem 'activesupport'
gem 'pygments.rb'
# gem 'nokogiri'
# gem 'iconv'
