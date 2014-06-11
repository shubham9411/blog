module Jekyll
  class ReadMoreFilter
  	safe true
    priority :normal
    def read_more(text="", url)
      text = text.to_str
      "#{text}<a href=\"#{url}\" rel=\"nofollow\" class=\"read-more pull-right\"> read more &raquo;</a>"
    end
  end
end

Liquid::Template.register_filter(Jekyll::ReadMoreFilter)