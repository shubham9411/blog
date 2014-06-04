---
layout: post
title: "Importance of Date field in an email's Header"
tldr: "A minor error in the Date header of our emails made Spam Assasin rate them as Spam!"
modified: 2012-04-04 10:20:00 +0530
tags: [email, header, spam]
category: technology
author: shireeshj
image:
  feature: 
  credit: 
  creditlink: 
comments: 
share: true
---

Thus far, we paid less attention to email delivery issues. We knew delivering to rediffmail is a pain. So we discouraged our users from using rediffmail. Apart from that we had FCrDNS and SPF configured and working fine. 
We had also configured [DKIM][6]. And then a month ago, we also added [DMARC][7] in monitor mode.

We were happy! Until...

Recently, we started getting loads of phishing emails from what appeared to originate from our own domain name [not our servers]. 

It told us two things. 
  
   1. [eLitmus.com][1] was growing in popularity
   2. We cannot ignore email delivery issue any longer

We ran our email through [Spam Assassin][4] checks and were surprised to see that we got a score of 6. Anything above 5 is BAD. It's a straight spam! But we knew we were not spamming. These were transactional emails triggered by our website on certain events, such as *New registration, or Forgot Password*.

It was almost by accident, we noticed that the timezone in the Date header of the email was appearing as +0580. Indian Standard Time (IST) is 5 hours and 30 minutes ahead of UTC. So this value should have been +0530, not +0580. Apparently, that is good enough reason for SpamAssassin to treat our mails as spam.

Tracing backwards, we discovered a bug in our application code and fixed it. It was a single line fix.

With this change,  [Spam Assassin][4] was happy to give us a score of zero.

That is just one part of one header. There are ten others which have to be configured correctly.

Here is an article with good insights in to how gmail calculates sender reputation. Its a little dated, but still relevent. [Sender reputation in a large webmail service (PDF)][3] 

By the way, here is a nice and free JSon API to check your [email's reputation][5]

[1]: http://www.elitmus.com
[2]: http://www.yahoo.com
[3]: http://www.google.com/url?sa=t&rct=j&q=what%20is%20email%20reputation%3F%20how%20to%20calculate%20email%20reputation%3F%20how%20to%20calculate%20sender%20reputation%3F&source=web&cd=2&ved=0CCgQFjAB&url=http%3A%2F%2Fwww.ceas.cc%2F2006%2F19.pdf&ei=Pmp9T76THsnYrQewg7TsDA&usg=AFQjCNEb_tYLRePQlW_RfMJZTkSiWdpy4A&cad=rja
[4]: http://wiki.apache.org/spamassassin/SpamAssassin
[5]: http://spamcheck.postmarkapp.com/
[6]: http://www.dkim.org/
[7]: http://www.dmarc.org/