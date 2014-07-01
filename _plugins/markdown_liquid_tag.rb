require 'sanitize'
require 'htmlentities'
module Jekyll
	module RenderMarkdownContentFilter

		def render_markdown_content(input)
			# @html_free = Sanitize.clean(input)
			@html_encode = HTMLEntities.new.encode input
			@html_encode
		end
	end
end

Liquid::Template.register_filter(Jekyll::RenderMarkdownContentFilter)