---
---

var searchContent = [];
var a = {};
{% for post in site.posts %}
	a= {};
	a["title"] = "{{ post.title | escape }}";
	a["category"] = "{{ post.category }}";
	a["url"] = "{{ post.url }}";
	a["date"] = "{{ post.date }}";
	a["content"] = {{ post.raw_content | json | strip_html }};
	searchContent.push(a);
{% endfor %}