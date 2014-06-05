---
layout: post
title: "Setting Up Amazon RDS as a Slave to a self-managed MySQL server"
modified: 2014-05-21 20:43:52 +0530
tags: [mysql,RDS,AWS,replication]
category: technology
author: shireeshj
tldr: The master user of RDS has curtailed permissions and is not allowed to run several commands, including those required to configure a slave
image:
  feature: 
  credit: 
  creditlink: 
comments: false 
share: true
---

Last week, we migrated our MySQL database server, which was running on an EC2 instance, to RDS. We hoped the migration process will be smooth.

As always, migrating a large database has its challenges. Business folks expect the minimum possible downtime.

The plan was simple. 

  1. Launch an RDS instance
  2. Load a full dump into it
  3. Configure it to act as a slave of the self-managed server (current master)
  4. On the D-day, pull the website down and promote the RDS instance to take over as the new master

We soon discovered that RDS comes with curtailed root permissions. There are several commands that are disallowed. Some of these include "CHANGE MASTER TO...."

What do we do now?

One option is, to carry out the migration in one go, while the website is offline. This meant the downtime is going to be for several hours, instead of minutes. Not an acceptable option.

Some R&D was all it took to discover how to proceed with the original approach. 

RDS comes with a bunch of stored procedures, which help you configure it as a slave. There is almost a one-to-one mapping of these stored procedures with the commands that are disallowed.


<table class="table table-bordered table-condensed table-hover">
<tr><th>MySQL Command</th><th>Corrosponding Stored Proc</th></tr>
<tr><td>CHANGE MASTER TO</td><td>mysql.rds_set_external_master</td></tr>
<tr><td>START SLAVE</td><td>mysql.rds_start_replication</td></tr>
<tr><td>STOP SLAVE</td><td>mysql.rds_stop_replication</td></tr>
<tr><td>RESET MASTER</td><td>mysql.rds_reset_external_master </td></tr>
</table>
    
So, Using these stored procedures, you can now configure your RDS instance as a slave to your self managed MySQL server


After loading a full dump to RDS, Call the stored procedure `mysql.rds_set_external_master` like this

    CALL mysql.rds_set_external_master ('servername', port, 'user', 'password', 'binlog-file', binlog-offset, 0);

Then
    
    CALL mysql.rds_start_replication;

This will make RDS a slave of your self managed mysql server. You can run "SHOW SLAVE STATUS" to see its working.

When it is time to promote RDS to master. You call these stored procedures

    CALL mysql.rds_stop_replication;

    CALL mysql.rds_reset_external_master;

That's it. Now point your applications to the RDS instance and take your site live.


*Note:*

For your RDS to work as a slave, it needs permissions to connect to port 3306 of your current master. Make sure you open this port for the RDS instance. 

You can run the following command to find out the ip address of your rds instance

    ping -c rdsname.cpesx66wwe7y.ap-southeast-1.rds.amazonaws.com





