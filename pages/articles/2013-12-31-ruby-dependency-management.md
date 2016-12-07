---
title: Managing Ruby
date: "2013-12-31T17:00:00.000Z"
layout: post
path: "/managing-ruby/"
category: Programming
tags: [Tools, Ruby, CLI]
description: Ruby environment setup and management with `chruby`, `ruby-install`, `.ruby-version` files and `bundler`.
---

In the Ruby community you have a lot of choices when it comes to versions of the language and implementations. This is part of the reason I love Ruby but it can also become hell unless you have a way of managing your development environment and project specific dependencies. What you need is an easy way to switch between Ruby versions along with the _context_ on either a local directory or system-wide basis.

I recently changed Ruby version manager and thought I'd write it down for posterity and in case others might like to do the same.

 1. Ruby version switcher - `chruby`
 2. Ruby version installer - `ruby-install`
 3. Switch Ruby version based on _context_ - `.ruby-version`
 4. Project specific dependency management - `bundler`

## Ruby Version Switcher

`chruby` is new when compared with the other options like [rvm][] or [rbenv][] however I decided to make the switch because I like it's design simplicity and I feel it adheres to the [Unix Philosophies][] better than the other. For instance, `rvm` doesn't just do one thing, it can install Ruby versions, manage gemsets and more. In addition it overrides `cd` for _context_ switching which for many is a major violation. `rbenv` on the other hand only manages Ruby versions however it does _context_ switching through a series of [shims][] each time any Ruby or gem binary is executed and requires you to run `rbenv rehash` whenever a new binary is installed. This is very cumbersome and unnecessarily complicated.

`chruby` takes a different, simpler approach. At it's core, it only modifies a few environment variables so the correct binary and set of libraries are loaded and uses [PROMPT_COMMAND][] to switch between _contexts_.

There are several ways of [installing][chruby#install] `chruby`. Since I develop on OSX, I used the following with [Homebrew][].

    brew install chruby

Next, add the following line to your _profile_ file (e.g. `.bashrc` or `.zshrc`, etc). This will allow `chruby` to search for installed Ruby versions (located in `~/.rubies` or `/opt/rubies` by default):

    source /usr/local/opt/chruby/share/chruby/chruby.sh

**Note:** Terminal in OSX opens a login shell and doesn't source `~/.bashrc` like other \*inux flavors. To solve this, "require" the `~/.bashrc` file by adding the following to your `~/.bash_profile`:

    [[ -s ~/.bashrc ]] && source ~/.bashrc

## Ruby Version Installer

Since I like the approach of `chruby` I decided to use [ruby-install][] by the same author instead of [ruby-build][] for Ruby version installing. This is necessary because `chruby` only "changes" the version being used. Type the following to install it on OSX with Homebrew:

    brew install ruby-install

Once installed, `ruby-install` makes it dead simple to install Ruby versions. To see a list of available Ruby versions type:

    ruby-install

To install [Ruby MRI][] 2.0 and 1.9, type:

    ruby-install ruby
    ruby-install ruby 1.9

## Auto-switching Ruby versions

With `chruby`, you can auto-switch your Ruby version when you `cd` (change _context_) between different projects. When you enter a directory containing a `.ruby-version` file, `chruby` will automatically switch things for you. To opt in to this feature, add the following to your _profile_ (e.g. `.bashrc` or `.zshrc`, etc):

    source /usr/local/share/chruby/auto.sh

With auto-switching enabled, you can set your "default" Ruby version to `1.9` by dropping a `.ruby-version` into your `$HOME` directory with the following:

    1.9.3-p484

You can also specify which version of Ruby to use on a project by project basis by adding a `.ruby-version` file to the "root" directory.

## Installing project dependencies

With [Bundler][], you can easily share your project across development environments and other team members. It maintains a consistent environment by installing dependencies specified in a `Gemfile` and make them available to your application.

Type the following to install:

    gem install bundler

Next, create a `Gemfile` in the "root" directory of your project. This can be done by running the following in Terminal:

    bundle init

Open the `Gemfile` add your specific dependencies:

    source 'https://rubygems.org'

    gem 'rack'
    gem 'rspec', :require => 'spec'

By default, `bundler` will install dependencies to your default system location for gems. While this is great, I prefer to keep things local whenever possible. To install them to `vendor/bundle` type:

    bundle install --path vendor/bundle

This creates a `Gemfile.lock` file in your project. This file is basically a manifest that describes the specific versions of the dependencies when your application last worked correctly.

To run executables that come with a gem installed with `bundler` use:

    bundle exec rspec spec/models

Or you can create scoped shortcuts to the executables. By typing the following, `bundler` will install them into the `bin` directory of your project:

    bundle install --binstubs

To execute them, type the following:

    bin/rspec spec/models

## Summary

Below are the entries for my `~/.bashrc` file:

    if [[ -e /usr/local/share/chruby ]]; then
      source /usr/local/opt/chruby/share/chruby/chruby.sh
      source /usr/local/share/chruby/auto.sh
      chruby $(cat ~/.ruby-version)
    fi

Overall I think that `chrbuy` with `bundler` is a simple and elegant solution for managing Ruby versions and individual project dependencies.

[Bundler]:http://bundler.io
[Ruby MRI]:http://en.wikipedia.org/wiki/Ruby_MRI
[ruby-build]:https://github.com/sstephenson/ruby-build
[ruby-install]:https://github.com/postmodern/ruby-install
[Homebrew]:http://brew.sh
[chruby#install]:https://github.com/postmodern/chruby#install
[PROMPT_COMMAND]:http://www.tldp.org/HOWTO/Bash-Prompt-HOWTO/x264.html
[shims]:https://github.com/sstephenson/rbenv/#understanding-shims
[rvm]:http://github.com/wayneeseguin/rvm
[rbenv]:https://github.com/sstephenson/rbenv/
[chrbuy]:http://pbrisbin.com/posts/chruby/
[Unix Philosophies]:http://en.wikipedia.org/wiki/Unix_philosophy#Mike_Gancarz:_The_UNIX_Philosophy

[How I setup chruby]:http://www.codeography.com/2013/09/23/how_i_setup_chruby.html
[Another chruby]:http://pbrisbin.com/posts/chruby/
