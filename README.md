This repo contains eLitmus blog hosted on Github Pages. The blog is accessible over https://www.elitmus.com/blog/

### Instructions for Developer:

This is what you need to do to set up a dev environment

```bash

# Clone this repo
git clone git@github.com:shireeshj/blog.git
cd blog

# install gems listed in Gemfile, including jekyll
bundle install

# install grunt cli tool
npm install -g grunt-cli

# install grunt and all other npm modules for processing assets
#   This command installs everything listed in package.json
npm install
```

You can create stub for a new blog post by running this command

```bash
rake new_post
```

This will ask for some information, such as title of the post, category name and tags. It will then generate a stub inside `_drafts` folder. You can add your content into the stub. Once your blog is read for publishing, run the following command

```bash
rake publish_post
```

This command will list all drafts and asks you to choose the one you wish to publish. It then moves the post from `_drafts` to `_posts`. You new blog post is now ready to go live!

**Note 1:**
Everytime you change your javascript, stylesheet or image files, `grunt` needs to precompile those. `Grunt` can keep monitoring for changes and automatically carry out precompilation if you run `grunt` command in watch mode.

```bash
grunt watch
```

**Note 2:**
As you may have noticed, we have two config files `_config` and `_devconfig`. As the name suggests `_devconfig` is for use in the development env. To make it easy to use this config file and to run jekyll also in watch mode, we have included a small shell script `server.sh`. If you run this script, jekyll will start in watch mode using the configuration file `_devconfig`. By default jekyll listens on `localhost:4000/blog/`. Point your browser to this url to see the blog site in action!






