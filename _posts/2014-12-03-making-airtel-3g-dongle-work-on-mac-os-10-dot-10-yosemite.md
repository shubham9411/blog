---
layout: post
title: "Making Airtel 3G dongle work on Mac OS 10.10 Yosemite"
tldr: "Is your Airtel 3G dongle not working on Mac OSX Yosemite, Here is a workaround until Airtel releases an updated dialer."
modified: 2014-12-03 09:29:33 +0530
category: technology
tags: [3G Dongle, Yosemite, Airtel]
author: shireeshj
image:
  feature: 
  credit: 
  creditlink: 
comments: 
share: true
---

If you use Airtel 3G Dongle (Mine is Huawei E173) on your Mac, and are having issue using the dongel after upgrading to Yosemite, airtel is of little help. They asked me to downgrade the OS to Mavericks!

The reason why the dialer software provided by airtel does not work is, that they internally use Apple USB Modem. According to [this FAQ on apple support site][2], your Operating system should be running in `32 bit mode` for the modem to work. Yosemite however, is `64 bit`.

Anyway, I could find multiple ways to overcome the problem. Here I am writing about the most simple one


###Step 1: 
Download the new driver from Huawei website [`Mac-V200R003B015D11SP00C983%28for Mac10.10%29.rar`][1]

![Huawei Website Screenshot]({{site.baseurl}}/images/airtel3g-yosemite/1-huawei-website.png)

###Step 2: 
Open the archive, you will find two files

    1. Mobile Partner install user guide.docx
    2. Mobile Partner.zip

The word document has detailed instructions with screenshots, on how to install.


###Step 3: 
Open the zip file `Mobile Partner.zip`, you will find `Mobile Partner.app`. Double click on this file to install the app


###Step 4: 
Once installed, start the app and go to Tools -> Options

![Tools -> Options Menu]({{site.baseurl}}/images/airtel3g-yosemite/2-options-menu.png)

###Step 5: 
In the Options window, choose "Profile Management" from the left side menu


![Profile Management]({{site.baseurl}}/images/airtel3g-yosemite/3-options-profile-management.png)


###Step 6: 
Click on "New" button to create a new profile. Give it a name, such as "airtel 3g". Also, make sure the "Access Nunber" is set to `*99#`. Click "Save", then "Ok".


![Configuring a new profile]({{site.baseurl}}/images/airtel3g-yosemite/4-new-profile-and-access-number.png)


###Step 7: 
Insert your Dongel into an USB port. You should see "Mobile Partner" application starting automatically. Choose the profile you created in Step 6 ("airtel 3g") and "Connect"


![The Dialer Screen]({{site.baseurl}}/images/airtel3g-yosemite/5-dialer-screen.png)


That's it.



[1]: http://consumer.huawei.com/en/support/downloads/detail/index.htm?id=31322
[2]: http://support.apple.com/en-in/HT201833