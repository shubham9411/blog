module Jekyll
  module ReadMoreFilter
    # def read_more(text="", site_url=Jekyll.configuration({})['url'], base_url=Jekyll.configuration({})['baseurl'], post_url)
    #   text = text.to_str
    #   url = "#{site_url}#{base_url}#{post_url}"
    #   "#{text}<a href=\"#{url}\" rel=\"nofollow\" class=\"read-more\"> read more &raquo;</a>"
    # end
    def read_more(text="", url)
      text = text.to_str
      "#{text}<a href=\"#{url}\" rel=\"nofollow\" class=\"read-more pull-right\"> read more &raquo;</a>"
    end
  end
end

Liquid::Template.register_filter(Jekyll::ReadMoreFilter)