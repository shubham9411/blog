---
layout: post
title: "Gotcha's while syntactically translating AES encryption logic from PHP to Ruby"
tldr: "Attempting to syntactically translate PHP code, that dealt with AES encryption logic, into Ruby stumped our Payment Gateway Service provider"
modified: 2014-05-25 20:39:45 +0530
tags: [ruby, PHP, AES, Cryptography, Encryption, Decryption]
category: technology
author: surendranath
image:
  feature: 
  credit: 
  creditlink: 
comments: false
share: true
---

Our Payment Gateway service provider recently launched a new platform with some nice-to-have features. We wanted those features and so we decided to migrate. Being one of the earliest adopters of the new platform, there was no integration kit available. We had to build it ourselves. Not a problem. Since we are a Ruby On Rails shop, we built our own Ruby integration kit. All went well and we pushed it to production.

A month or two later, we got an email from our gateway provider seeking our help with writing the `encryption` and `decryption` logic for the Ruby integration kit they were developing. We were a little surprised, because we noticed they had already published integration kits for PHP, Python, JAVA etc. How difficult can it be to translate that to Ruby?

Turns out, syntactic transalation of code from one programming language to another does not always work. A slightly more deeper knowledge helps. We could almost guess where they were getting stuck.

Before we get to the story, some backgroung on the encryption algo will add clarity.

For secure communication between our server and the gateway, the prescribed cipher was AES, specifically symmetric-key block cipher with a 128 bit secret key in CBC mode. Since OpenSSL already implements this algo and is avaliable on almost all platforms, most programming languages just bundle a wrapper for OpenSSL.

So if its the same OpenSSL that the wrappers call, why couldn’t the gateway service provider translate their own PHP code to Ruby?

### Here is why:

AES works by breaking the plain text (the text to be encrypted) into blocks of 128 bits (or 16 bytes). In CBC mode, each block is XORed with the key to get cipher text of that block. The cipher text of the previous block is used for encrypting the next block... so on and so forth, until all the blocks are encrypted.

Note that the length of the cipher text will be exactly same as that of the plain text.

The problem occures with the last block. If the length of the plain text is not a multiple of 128. the last block will be shorter than 128 bits. Since the algo can work only on blocks of 128 bits, It is a common practice to pad the last block so that it becomes equal to 128 bits in lenght. This padding is subsequently discarded after decryption.

**Note:** The actual algo is more complicated than this. We have deliberately left out details that are not relevent for this post.

This is the encryption method in the PHP integration kit published by the gateway service provider

{% highlight PHP linenos%}
function encrypt($plainText,$key)
{
  $secretKey = hextobin(md5($key));
  $initVector = "...";
  $openMode = mcrypt_module_open(MCRYPT_RIJNDAEL_128, '','cbc', '');
  $blockSize = mcrypt_get_block_size(MCRYPT_RIJNDAEL_128, 'cbc');

  $plainPad = pkcs5_pad($plainText, $blockSize);  //  <---- Padding

  if (mcrypt_generic_init($openMode, $secretKey, $initVector) != -1) 
  {
    $encryptedText = mcrypt_generic($openMode, $plainPad);
    mcrypt_generic_deinit($openMode);      
  } 
  return bin2hex($encryptedText);
}

// Padding method
function pkcs5_pad ($plainText, $blockSize)
{
  // padding logic here
}
{% endhighlight %}

And here is the same implemented in Ruby

{% highlight ruby linenos %}
def self.encrypt(plain_text, key)
    secret_key     = Digest::MD5.digest(key)
    cipher         = OpenSSL::Cipher::AES.new(128, :CBC)
    cipher.encrypt
    cipher.key     = secret_key
    cipher.iv      = INIT_VECTOR
    encrypted_text = cipher.update(plain_text) + cipher.final
    return (encrypted_text.unpack("H*")).first
end
{% endhighlight %}

Notice any difference?

It turns out that, unlike in Python, PHP and few other languages, Ruby wrapper for OpenSSL automatically takes care of padding (default behaviour). This is clearly mentioned in the [documentation][1]. For some reason, techies at our gateway service provider overlooked this and hit a dead-end.

By the they, they were gracious enough to acknowledge our contribution in their Ruby Integration Kit (accessible only to their subscribers)

But We have open sourced our code here '[cca_crypto][2]'. We have plans of make this into a complete package - with view generators etc., and publish this as a rubygem. We shall gladly accept any pull request!


[1]: https://ruby-doc.org/stdlib-2.0/libdoc/openssl/rdoc/OpenSSL/Cipher.html#method-i-final
[2]: https://github.com/elitmus/cca_crypto


