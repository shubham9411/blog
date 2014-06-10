---
layout: post
title: "Beware of creating $HOME/.ssh folder by hand, when SELinux is turned on"
tldr: If you created $HOME in a non-standard place, and created $HOME/.ssh by hand, SELinux may not like it. To please SELinux, you need to set the right "file context" as described in this post
modified: 2014-05-23 12:32:45 +0530
tags: [SSH, SELinux]
category: technology
author: shireeshj
image:
  feature: 
  credit: 
  creditlink: 
comments: 
share: true
---

I was experimenting with `chef` to manage our Linux boxes. As a standard practice, our application user `deployer` is homed in `/applications/deployer` rather than the usual `/home/deployer`.

To enable password less login, I appended my public key to `~/.ssh/authorized_keys` 

     ssh-copy-id -i ~/.ssh/id_rsa deployer@remote.server

The first time I run this command, I will be prompted for a password to install my key. After this, I can run the below command to login without a password:

    ssh -i ~/.ssh/id_rsa deployer@remote.server

However, that did not work as expected.

For some reason, `sshd` was unable to read the `authorized_keys` file. I checked all the usual things.. all looked fine. Everything seem to work just fine when `SELinux` was running in `permissive` mode on the remote server, but not when it was in `enforcing` mode.

Discovered that if `.ssh` folder was created by hand (or even the folder containing `.ssh` folder), we need to do few additional things.

**Step 1:** 

Open this file /etc/selinux/targeted/contexts/files/file_contexts.homedirs and append the following line to the bottom

     /applications/deployer/[^/]*/\.ssh(/.*)?     system_u:object_r:ssh_home_t:s0


Note: remember to adjust the path as per your needs.


**Step 2:** run the following command

    restorecon -R -v /applications/deployer/.ssh

Again, remember to adjust the path as per your needs.

Now you are all set!

     ssh -i ~/.ssh/id_rsa deployer@remote.server

should log you in without asking for a password!
