---
layout: post
title: "How we host our blog on GitHub pages and yet serve it from our own Sub-URL"
tldr: "Mapping a custom domain apex or subdomain to a site hosted on GitHub Pages is straight forward. But if your domain apex is already in use,and you still want your site hosted on GitHub Pages to be served as a sub-url, you need some magic to make it happen. This blog post discusses one such magic"
modified: 2014-08-18 12:26:44 +0530
category: technology
tags: [Github, nginx, reverse proxy]
author: mohitnegi
image:
  feature: 
  credit: 
  creditlink: 
comments: false
share: true
---


There are umpteen number of blog posts telling you how to host your static site on GitHub Pages for free. They also tell you how to serve such a site from your own domain name.

As you may have guessed, this blog is also hosted on GH Pages. Don’t believe me? try visiting this URL `https://shireeshj.github.io/blog/`

It is easy to map a `github.io` url such as this, to a subdomain. For example, it is easy to map the url to `https://blog.elitmus.com/blog/`.  All you need to do is check-in a file named CNAME into the root folder of your git repo that contains your static site.

What if you want your static site to be served from domain apex? That is easy too.  [GitHub pages help][1] explains this in a simple manner. 

However, If your domain apex is already taken, say by your other website, you have a problem.  To host your static site on a domain apex (or a sub-url of domain apex) the domain apex should be available exclusively for use by github pages.

We had to overcome this very problem, since our business website is already hosted on `elitmus.com` (and `www.elitmus.com`).  Given that we are not in great love with subdomains. We had to find a workaround. And here is what we did:

Since we use nginx to server our business website, all we had to do was to write a simple traffic-cop rule. What this rule did was, to parse the request url to see if it starts with `/blog/`. If yes, then the request is reverse proxied to GitHub Pages. If no, then it is served from local disk. 

The relevant lines from the config file are here

		location /blog/ {
		    proxy_pass       http://shireeshj.github.io/;
		    proxy_redirect off;
		    proxy_set_header Host <shireeshj.github.io>;
		    proxy_set_header X-Host <shireeshj.github.io>;;
		    proxy_set_header X-Real-IP $remote_addr;
		    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		  }


This is how we get free hosting for our blog, yet serve it from our official URL. If GitHub pages ever stops us from reverse proxying, we shall simply spin our own webserver to run this static site and reverse proxy to that web server.

[1]: https://help.github.com/articles/setting-up-a-custom-domain-with-github-pages
[2]: https://shireeshj.github.io/blog/
