---
layout: post
title: "Android Versioning Using Docker &amp; Git Like A Pro"
tldr: 
modified: 2018-06-10 12:25:27 +0530
category: technology
tags: [android, docker, git, deployment, versioning]
author: mukku
image:
  feature: 
  credit: 
  creditlink: 
comments: 
share: 
---

Unlike web, android still lacks the ease of version deployments. Specially when you don't want to use Play Store.

![alt text](https://www.genymobile.com/wp-content/uploads/2015/07/Android-Docker.png "Shipping Android Deployment")



### Introduction

There will be five stages:

1. Signing application
2. Versioning of application. For that we gonna use git revision and Major.Minor.Patch naming convention.
3. Building application using a docker. So that running environment doesn't change.
4. Pushing new release to s3, while maintaining the previous versions.
5. Pushing new tag to git, with the new version. So, we'll have tags for each version.

Basically, we gonna use docker, git, and some simple hacks to put things in work. In the end, I've shared a sample application.



### *Stage 1*: Signing Our Application

It's better to start thinking about security right from the big bang.
From android studio, you can generate a new keystore, a jks file. [Help?](https://developer.android.com/studio/publish/app-signing)
Copy the keystore file details in a *config.yaml* file like below:

{% highlight yaml %}
key_store:
  key: /xyz/xyz.jks
  alias: key0
  store_password: wuhoo
  key_password: nibataunga
{% endhighlight %}

Studio will take care of signing, but to generate signed apk from command line, you'll need to make some changes in your build.gradle. The credentials we have put in above yaml file will be passed as command line args to gradle(Build stage[2]). 

{% highlight groovy %}
android {
    ...
    signingConfigs {
        release {
            if (project.hasProperty('APP_RELEASE_STORE_FILE')) {
                storeFile file("$APP_RELEASE_STORE_FILE")
                storePassword "$APP_RELEASE_STORE_PASSWORD"
                keyAlias "$APP_RELEASE_KEY_ALIAS"
                keyPassword "$APP_RELEASE_KEY_PASSWORD"
            }
        }
    }
    buildTypes {
        release {
          ...
          if (project.hasProperty('APP_RELEASE_STORE_FILE')) {
              signingConfig signingConfigs.release
          }
        }
    }
}
{% endhighlight %}


### *Stage 2*: Release Versioning, Digging Git 

Let's follow the old school way.

Major.Minor.*GitRevision*.Patch

I won't go down the road to explain first two and the last one. Let's dig into GitRevision

GitRevision will make versioning easy and consistent. It counts the number of commits from git, so you'll get incremental values everytime you release a new version.

We'll put the below code in build.gradle[app]

{% highlight groovy %}
def getGitRevision = { ->
    try {
        def stdout = new ByteArrayOutputStream()
        exec {
            standardOutput = stdout
            commandLine 'git', 'rev-list', '--first-parent', '--count', 'master'
        }
        logger.info("Building revision #"+stdout)
        return stdout.toString("ASCII").trim().toInteger()
    }
    catch (Exception e) {
        e.printStackTrace();
        return 0;
    }
}
{% endhighlight %}

And in build.gradle[app]

{% highlight groovy %}
    defaultConfig {
        ...
        versionCode = 10000000*majorVersion+10000*minorVersion + 10*revision
        versionName = 'v' + majorVersion + '.' + minorVersion + '.' + revision + patch
    }
{% endhighlight %}




### Docker Image, Savage

We first need to build a docker image with minimum libraries and dependencies required.

{% highlight docker %}
FROM openjdk:8
RUN apt-get update
RUN cd /opt/
RUN wget -nc https://dl.google.com/android/repository/sdk-tools-linux-4333796.zip
ENV ANDROID_HOME /opt/android-sdk-linux
RUN mkdir -p ${ANDROID_HOME}
RUN unzip -n -d ${ANDROID_HOME} sdk-tools-linux-4333796.zip
ENV PATH ${PATH}:${ANDROID_HOME}/tools:${ANDROID_HOME}/tools/bin:${ANDROID_HOME}/platform-tools
RUN yes | sdkmanager --licenses
RUN yes | sdkmanager \
      "platform-tools" \
      "build-tools;27.0.3" \
      "platforms;android-27"

RUN apt-get -y install ruby
RUN gem install trollop
{% endhighlight %}

Trollop will be helpful in compiling scripts, spicing the boring command line args.

We are using openjdk as base image for java environment and installed our sdk with version 27. You can change that accordingly.


#### Building the image:

{% highlight bash %}
docker build -t ${docker_image} -f ./scripts/Dockerfile .
{% endhighlight %}

Or you can directly pull my latest base image.

{% highlight bash %}
docker pull mukarramali98/androidbase
{% endhighlight %}



### Docker container on the way

To automate the process, let's dig into a small script:

{% highlight bash %}
#!/usr/bin/env bash
set -xeuo pipefail

app_name=xyz
container_name=androidcontainer

if [ ! "$(docker ps -q -f name=${container_name})" ]; then
    if [ "$(docker ps -aq -f status=exited -f name=${container_name})" ]; then
        # cleanup
        docker rm $container_name
    fi
    # run your container
    docker run -v ${PWD}:/${app_name}/ --name ${container_name} -w /${app_name} -d -i -t mukarramali98/androidbase
fi

docker exec ${container_name} ruby /${app_name}/scripts/compile.rb -k /${app_name}/config.yaml
{% endhighlight %}

Here we first check if the container already exists. Then create accordingly.
While creating the container, we *mount* our current project directory. So next time we run this container, our updated project will already be there in the container.



### *Stage 3*: Running container, *Build Stage*

We run the container, with our compile script. Pass the signing config file we created earlier.

{% highlight ruby %}
config = YAML.load_file(key_config_file)

key_store = config['key_store']
output_file = 'app/build/outputs/apk/release/app-release.apk'
`rm #{output_file}` if File.exists?output_file

puts `#{File.dirname(__FILE__)}/../gradlew assembleRelease --stacktrace \
    -PAPP_RELEASE_STORE_FILE=#{key_store['key']} \
    -PAPP_RELEASE_KEY_ALIAS=#{key_store['alias']} \
    -PAPP_RELEASE_STORE_PASSWORD='#{key_store['store_password']}' \
    -PAPP_RELEASE_KEY_PASSWORD='#{key_store['key_password']}'`
{% endhighlight %}



### *Stage 4*: Pushing to S3

So, now we have build a signed apk from a docker container. It's time to push them.
Connect with your s3 bucket and generate *$HOME/.s3cfg* file, and pass it to ruby script below:

{% highlight ruby %}
if File.file?(s3_config)
  # Push the generate apk file with the app and version name
  `s3cmd put app/build/outputs/apk/release/app-release.apk s3://#{bucket}/#{app_name}-#{version_name}.apk -m application/vnd.android.package-archive -f -P -c #{s3_config}`
  # application/vnd.android.package-archive is an apk file format descriptor

  # Replace the previous production file
  `s3cmd put app/build/outputs/apk/release/app-release.apk s3://#{bucket}/#{app_name}.apk -m application/vnd.android.package-archive -f -P -c #{s3_config}`

  # To keep the track of latest release
  `echo #{version_code}> latest_version.txt`
  `s3cmd put latest_version.txt s3://#{bucket}/latest_version.txt -f -P -c #{s3_config}`
  `rm latest_version.txt`
  puts "Successfully released new app version."
end
{% endhighlight %}

`application/vnd.android.package-archive` is the apk file type descriptor.


### *Stage 5*: Finally, Git Tagging The New Release Version, *#hashtag*

{% highlight ruby %}
def push_new_tag version_name
  `git tag #{version_name}`
  `git push origin #{version_name}`
  puts "New tag pushed to repo."
end
{% endhighlight %}
