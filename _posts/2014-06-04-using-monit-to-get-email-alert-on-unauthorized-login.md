---
layout: post
title: "Using Monit to get email alert on unauthorized login"
tldr: Apart from process monitoring, monit can also send alert messages on certain events. This feature can be used to get notified whenever someone logs into your unix/linux server
modified: 2014-06-04 09:57:11 +0530
category: technology
tags: [ssh, monit, alert]
author: shireeshj
image:
  feature: 
  credit: 
  creditlink: 
comments: 
share: true
---


For a long time, we had our custom written `perl` script to alert us whenever someone logged into our production servers from an ip address we do not recognize (not white listed). The script looked somewhat like this...

{% highlight perl %}
#!/usr/bin/perl
# script file: alert_on_login.pl
#
my $login_str = "Accepted publickey";
my $whitelist_ip = "122.123.123.111";

sub sendEmail
{
        my ($to, $from, $subject, $message) = @_;
        my $sendmail = '/usr/lib/sendmail';
        open(MAIL, "|$sendmail -oi -t");
        print MAIL "From: $from\n";
        print MAIL "To: $to\n";
        print MAIL "Subject: $subject\n\n";
        print MAIL "$message\n";
        close(MAIL);
}

while (<>) {
        if (grep(/$login_str/, $_) && !grep(/$whitelist_ip/, $_)) {
                print $_;
                chomp $_;
                @arr = split(' ', $_);
                sendEmail('recepient1@elitmus.com, recepient2@elitmus.com',
                          'monit@elitmus.com',
                          'Server login from ' . $arr[10],
                          $_);
        }
}
{% endhighlight %}

All we need to do is to run this script in the background as a daemon, and it will send us an email alert whenever someone logs in successfully. As root user start the script like this:

      # (perl alert_on_login.pl /var/log/auth.log &)


Eversince we started using [monit][1] for the usual purpose (monitoring processes), we have also entrusted [monit][1] to do the job of the above perl script. [monit][1] makes this super simple...

[Monit][1] is a popular opensource process monitoring tool. It is used mostly for monitoring health of any linux process and take necessary action if any of the set parameters are breached. Monit can restart a process if the process failed for some reason. Monit can also notify you of incidents and actions taken.

[See this][2] to learn more about [monit's][1] alert capabilities.

Monit's global configuration file is usually `/etc/monit/monitrc`. Here is what [monit][1] needs to be told about how to send email alerts

{% highlight bash %}
...
# This is our SMTP server settings. The complete syntax is
# SET MAILSERVER <hostname [PORT] [USERNAME] [PASSWORD] [using SSLAUTO|SSLV2|SSLV3|TLSV11|TLSV12] [CERTMD5 checksum]>, ...
#          [with TIMEOUT X SECONDS]
#          [using HOSTNAME hostname]
#
# But for our purpose, localhost is good enough
SET mailserver localhost

# This is the email template for alert messages
SET mail-format {
  from: monit@elitmus.com
  subject: $SERVICE $EVENT at $DATE
  message: Monit $ACTION $SERVICE at $DATE on $HOST: $DESCRIPTION.
           Yours sincerely,
           monit
}

# Alerts can be triggered for various reasons. Successful ssh login is just one of those reasons.
# Since this is a global configuration, we can tell monit to not send alerts for certain events
#  We also specify the email address of the recepient who will receive the alerts

set alert recepient1@elitmus.com NOT ON { action, instance, pid, ppid, nonexist }
...
{% endhighlight %}

And then we add this config file `ssh_logins.conf` specific to sshd relating stuff

{% highlight bash %}
check file ssh_logins with path /var/log/auth.log
  ignore match "/etc/monit/whitelist_ips.regex"
  if match "Accepted publickey" then alert
{% endhighlight %}

Notice how we tell [monit][1] to ignore logins from known ip addresses. We can now store all whitelist ip addresses in a separate file `/etc/monit/whitelist_ips.regex`, one per line.

**Note:** We have disabled password based login and hence do not monitor for passworded logins. If you use passworded login, you should change `"Accepted publickey"` to `"Accepted password"` 


Happy monitoring!

[1]: https://mmonit.com/monit/
[2]: https://mmonit.com/monit/documentation/monit.html#alert_messages