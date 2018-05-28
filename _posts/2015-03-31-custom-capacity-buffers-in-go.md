---
layout: post
title: "Custom Capacity Buffers In Go"
tldr: "Create Buffers and Files in Golang with Custom Capacity by creating wrapper over Buffer struct in Golang"
modified: 2015-03-31 11:58:04 +0530
category: technology
tags: [go,ruby,buffer]
author: surendranath
image:
  feature: 
  credit: 
  creditlink: 
comments: 
share: true
---


At elitmus we use ruby to create most of our tools and most of our applications  are also written in ruby. Recently I started exploring ways to build our tools especially the backend tools in languages other than ruby which have much lesser memory footprint and better efficiency. One such cases was to create a sandboxed environment for running  untrusted code on our servers. After evaluating multiple languages, I decided to use golang because of it’s excellent library support coupled with the fact the docker(a sandboxed env) was also written in go.

One of the many challenges we faced while creating our sandbox was  redirection of the standard output of untrusted code, as this simple code below will fill up the disk if redirected to file or use all system resources if redirected to a buffer.


{% highlight c linenos %}
while(true) printf(“I am the green monster”);
{% endhighlight %}

So the problem is,how to limit the size of a file or buffer?, I  started with   buffers  as they are more easy to implement.  I assumed that the `Write` method of the `Buffer` struct which writes to the buffer, will panic with `ErrTooLarge` error if buffer size is above it’s capacity, which i hoped to catch using `recover` builtin function.

This is the code snippet below.

{% highlight go linenos %}
   defer func() {
      if r := recover(); r != nil {
         fmt.Println("Should catch if anyone panics")
      }
   }()
  a := bytes.NewBuffer(make([]byte, 0, 2))
  for {
    _,err := a.Write([]byte("create boom"))
    if err != nil {
      fmt.Println(err.Error())
       return
    }

  }
{% endhighlight %}

On running this code, my system was frozen and crashed a little later. This is not what i expected, On further investigation by looking to [source code][2] and reading the `bytes` package documentation again, i found out that `Write` method in the `bytes` package is growing the capacity of the  buffer if the buffer capacity is not enough, which in turn is increasing the amount of memory and resources used by the system.


After some googling and with good help from the go community(thanks to [dave cheney][1]), i decided  to create wrapper around the buffer struct and implement my own `io.Writer` interface by implementing Write method for the wrapper which writes to the buffer.

My custom wrapper’s will take capacity as parameter when initializing and the `Write` method will do the required action if there is a buffer overflow, instead of increasing the capacity like the `Write` method from `bytes` package. This is done by monitoring the size of the buffer before writing to the buffer.


This is code snippet of my custom wrapper.

{% highlight go linenos %}
type MyBuffer struct {
    cap   int
    mybuf *bytes.Buffer
}

func (b *MyBuffer) Write(p []byte) (n int, err error) {
    if len(p)+b.mybuf.Len() > b.cap {
        fmt.Printf(b.mybuf.String())
        panic("Buffer Overflow")
    } else {
        b.mybuf.Write(p)
    }
    return len(p), nil
}

func NewBuffer(buf []byte, cap int) *MyBuffer {
    return &MyBuffer{mybuf: bytes.NewBuffer(buf), cap: cap}
}

func main() {

    defer func() {
        if r := recover(); r != nil {
            fmt.Println("recover in yes")
        }
    }()

    a := NewBuffer(make([]byte, 0, 100), 200)
    for {
        _, err := a.Write([]byte("Check for Buffer Overflow"))
        if err != nil {
            fmt.Println(err.Error())
            return
        }
    }
}


{% endhighlight %}

On running this code, it worked as expected, hopefully will be deployed in production.
The same goes for files as well.

**Note:** useful links, [on docker][3],[on golang bytes package][4]

[1]: https://github.com/davecheney
[2]: https://golang.org/src/bytes/buffer.go?s=4155:4206#L115
[3]: https://www.docker.com/
[4]: https://golang.org/pkg/bytes/
