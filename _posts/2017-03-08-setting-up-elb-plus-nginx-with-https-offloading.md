---
layout: post
title: "Setting up OAuth2 callbacks in Rails with HTTPS offloading on load balancers"
tldr: "If you use OAuth2 with your Rails application and your application sits behind a load balancer (where you offload HTTPS), then you may start seeing <b>'CSRF detected'</b> errors thrown by Rails."
modified: 2017-03-08 09:47:23 +0530
category: technology
tags: [ELB,NGINX,https offloading,OAuth,Rails]
author: sivapraveen,akash
image:
  feature: 
  credit: 
  creditlink: 
comments: 
share: true
---

“HTTPS everywhere” is not a luxury anymore. It is a necessity. Thankfully, obtaining an SSL certificate has become easier too, with initiatives such as [Let’s Encrypt][1], [GeoTrust][10], [Positive SSL][11], [StartSSL][12]. Even cloud based services such as [Cloudflare][2] and [Amazon AWS][3] provide free SSL certificates to their customers. 

####**Here is setting some context to help the reader appreciate the discussion**:
We host our rails applications on [Amazon AWS][3]. We generally use three different environments - development, staging and production. Development environment is generally local to a developer while staging and production are hosted on the cloud. There is a minor difference in the way we configure our staging and production environments. Our staging environment typically contains a single machine instance hosting our application. This single instance is exposed to internet directly (has a public IP). On the other hand, our production environment typically contains a cluster of instances for the sake of horizontal scaling. These instances typically do not have a public IP and hence not exposed to internet directly. We put this cluster behind an internet-facing [Elastic Load Balancer (ELB)][4].

We use [chef-solo][5] to manage our cloud infrastructure as well as to deploy code to various environments.

#####**The Problem Statement:**
For the sake of this discussion, we shall limit ourselves to configuring SSL certificates obtained from the two free providers, namely [Let's Encrypt][1] and [Amazon AWS][3].

Using [Let’s Encrypt][1] in a clustered setup is tricky, since you need to make one of the instances stateful, in the sense, one instance needs to be given the responsibility of obtaining and renewing SSL certificate from [Let’s Encrypt][1]. All other instances need to copy this certificate every time its renewed. This requirement unnecessarily complicates the setup and also takes away some amount of flexibility. Also, [Let's Encrypt][1] does not issue wildcard certificates and the validity of a certificate is just 90 days

The certificates provisioned from the other provider, [Amazon AWS][3], can only be installed on an [ELB][4]. Hence is best suited for our clustered setup, namely production. An added advantage is that Amazon can issue wildcard certificates. We could always add an [ELB][4] to our staging environment (even though we will never have more than one instance), but that costs extra money for no reason. 

This leaves us with these options

<table class="custom_table">
  <tr>
    <th class="custom-t">Environment</th>
    <th class="custom-t">Best Option</th>
  </tr>
  <tr>
    <td class="custom-t">Staging</td>
    <td class="custom-t">Let's Encrypt</td>
  </tr>
  <tr>
    <td class="custom-t">Production</td>
    <td class="custom-t">Amazon AWS</td>
  </tr>
</table>
<br>
We went ahead with this choice. Using [chef][5] to manage our setup came handy.

We first configured our Staging environment and everything worked as expected. 

However, the same application, in production environment, started throwing `CSRF detected` Error whenever an [OAuth2][6] callback happened. This was really strange. Our application integrated with two different OAuth providers, and the problem was consistent with both these providers.
 
#####**What's the issue?**

The only difference between our Staging and Production setups was the [ELB][4]. 

In production, we offloaded HTTPS at the [ELB][4]. Plain HTTP request would hit the [NGINX][7] web server, which in turn would reverse-proxy it to unicorn and rails.

`CSRF detected` was clearly an error emitting from the rails application. Not from [NGINX][7], and not from the [ELB][4].

A closer look would reveal that the rails application had no way to know if the callback was made on a http:// URL or a https:// URL, because it sees only HTTP (due to offloading).  Was this the reason rails was unhappy? 

[OAuth2][6], by design, does not accept plain HTTP callbacks (unless it is to localhost).

####**How do we move forward?**

#####**PoC to prove the theory**

Just to confirm what we think is the cause, we <b>enabled HTTPS</b> on [NGINX][7] (like we did in our staging environment). This was in addition to HTTPS on the Load balancer. We reconfigured the Load Balancer to NOT offload HTTPS but forward the request as-is to [NGINX][7].

What do we have now? The `CSRF detected` errors are gone. Application behaves just like it should.

This confirmed our theory. 

But the question now is, how do we achieve our desired configuration of offloading HTTPS at the [ELB][4] ? Is it just not possible ? 

**The Solution**

We have been using <b>X-Forwarded-For</b> header while reverse proxying to unicorn so that our rails application knows the client IP address (rather than the IP address of the Load Balancer). We need this for logging and tracking.

Could there be something on similar lines to tell the rails application that the request was not on HTTP but on HTTPS?

Sure there is. We had to set a header in our reverse proxy configuration:

    X-Forwarded-Proto  to  https

For [NGINX][7], we do it like this:

{% highlight NGINX %}
  proxy_set_header X-Forwarded-Proto https;
{% endhighlight %}

Voila, Rails is happy and things are back to normal!

**<u>Details:</u>**

**Csrf detected!**

Rails bothers about SSL only at two places, 
<br>
1. At environment config, force_ssl.
<br>
2. At external included Gem like [Omniauth][8]. 
<br>

In ***Rails environment config***.

{% highlight ruby %}
  config.force_ssl = true
{% endhighlight %}

This does the trick, but doesn’t seem like a good idea to enable this option in Rails because, we offload https at [NGINX][7]. For Rails, request came in http, so it does a permanent redirect to https, which ends in a infinite loop.

Our stack trace gave a clue that error might be inside <q>***omniauth***</q> gem.

<div class="back-trace-div">
    <span class="back-trace-row"><b>actionpack-4.2.7.1</b>/lib/abstract_controller/<b>base.rb</b>:132 → process</span><br>
    <span class="back-trace-row"><b>actionview-4.2.7.1</b>/lib/action_view/<b>rendering.rb</b>:30 → process</span><br>
    <span class="back-trace-row"><b>actionpack-4.2.7.1</b>/lib/action_controller/<b>metal.rb</b>:196 → dispatch</span><br>
    <span class="back-trace-row"><b>actionpack-4.2.7.1</b>/lib/action_controller/metal/<b>rack_delegation.rb</b>:13 → dispatch</span><br>
    <span class="back-trace-row"><b>actionpack-4.2.7.1</b>/lib/action_controller/<b>metal.rb</b>:237 → block in action</span><br>
    <span class="back-trace-row"><b>actionpack-4.2.7.1</b>/lib/action_dispatch/routing/<b>route_set.rb</b>:74 → dispatch</span><br>
    <span class="back-trace-row"><b>actionpack-4.2.7.1</b>/lib/action_dispatch/routing/<b>route_set.rb</b>:43 → serve</span><br>
    <span class="back-trace-row"><b>actionpack-4.2.7.1</b>/lib/action_dispatch/journey/<b>router.rb</b>:43 → block in serve</span><br>
    <span class="back-trace-row"><b>actionpack-4.2.7.1</b>/lib/action_dispatch/journey/<b>router.rb</b>:30 → each</span><br>
    <span class="back-trace-row"><b>actionpack-4.2.7.1</b>/lib/action_dispatch/journey/<b>router.rb</b>:30 → serve</span><br>
    <span class="back-trace-row"><b>actionpack-4.2.7.1</b>/lib/action_dispatch/routing/<b>route_set.rb</b>:817 → call</span><br>
    <span class="back-trace-row"><b>omniauth-1.3.1/lib</b>/omniauth/<b>strategy.rb</b>:186 → call!</span><br>
    <span class="back-trace-row"><b>omniauth-1.3.1/lib</b>/omniauth/<b>strategy.rb</b>:164 → call</span><br>
</div>

As we dug inside the Gem and found out that [Omniauth][8] looks at these headers

<a href="https://github.com/intridea/omniauth/blob/ed1f9a8994e6b660e2eed3f85bb87c81229480fa/lib/omniauth/strategy.rb#L493-L499" target="_blank" >lib/omniauth/strategy.rb#L493-L499</a>

{% highlight ruby %}
def ssl?
  request.env['HTTPS'] == 'on' ||
  request.env['HTTP_X_FORWARDED_SSL'] == 'on' ||
  request.env['HTTP_X_FORWARDED_SCHEME'] == 'https' ||
  (request.env['HTTP_X_FORWARDED_PROTO'] && request.env['HTTP_X_FORWARDED_PROTO'].split(',')[0] == 'https') ||
  request.env['rack.url_scheme'] == 'https'
end
{% endhighlight %}
This is where we found that setting up [X_FORWARDED_PROTO][9] to https should fix our problems. 

Initially, this [X_FORWARDED_PROTO][9] was set to $scheme. Which will be http for production as https is offloaded at ELB. 

Now, by setting [X_FORWARDED_PROTO][9] to https, we are making sure that redirects are happening on https.


[1]: https://letsencrypt.org/
[2]: https://www.cloudflare.com/
[3]: https://aws.amazon.com/
[4]: https://aws.amazon.com/elasticloadbalancing/
[5]: https://docs.chef.io/chef_solo.html
[6]: https://oauth.net/2/
[7]: https://www.nginx.com/resources/wiki/
[8]: https://github.com/omniauth/omniauth
[9]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-Proto
[10]: https://www.geotrust.com/ssl/free-ssl-certificate/
[11]: https://www.positivessl.com/
[12]: https://www.startssl.com/