---
title: Homebrew
date: "2014-10-12T16:00:00.000Z"
layout: post
category: Programming
tags: [Tools, CLI]
description: How to use [Homebrew](http://brew.sh/) and [Cask](http://caskroom.io/) for OS X dependency management and automate installation with a custom `Homebrew.sh` file.
---

[Homebrew][] is a package manager for OS X. It's a fantastic tool I've been using it for years to download and install free Unix software. It makes it dead simple to install software and their dependencies with just one command. For instance, to install the version control system Git you only need to type the following into Terminal (Applications > Utilities):

```shell
brew install git
```

In the past if you didn't use a package manager like [MacPorts][] or [Fink][], you would have to build each one manually from source. This was a tedious, error prone and time consuming task. For instance, the above one-liner would require the following steps on OS X:

1. download
2. unzip
3. configure
4. make
5. install

## Installing Homebrew

<div class="alert note">
  <strong>Note:</strong> You need the Xcode command line tools to install Homebrew. They come with Xcode however if you don't have Xcode already installed, OS X Mavericks (10.9) should auto-prompt you to.
</div>

To [install Homebrew][], type the following into Terminal:

```shell
ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
```

This will download and install Homebrew under `/usr/local` with the main script at `/usr/local/bin/brew`. It will also create the directory `/usr/local/Cellar/` where all the files for your `brew` packages will be installed.

With Homebrew installed, an easy way to familiarize yourself with it and the commands available is to run `man brew` in Terminal.

## Homebrew Cask

[Cask][] is an extension of Homebrew for installing large binary applications. With it you can automate the installation of applications that can be built from source. With it, you'll never have to drag and drop another GUI application to your Applications directory again.

To install Cask, run the following in Terminal:

```shell
brew install caskroom/cask/brew-cask
```

Once installed, you can use the `cask` sub-command to install additional applications. For instance, you can install the Google Chrome browser with the following:

```shell
brew cask install google-chrome
```

## Custom Install Scripts

One of the main reasons I use Homebrew and Cask is to automate the installation of a new computer or a projects system dependencies.

```shell
#!/usr/bin/env bash

# Make sure we’re using the latest Homebrew
brew update

# Upgrade any already-installed formulae
brew upgrade

# Add additional formulae lookup repos
# Cask
brew tap caskroom/versions

# Install formulas
brew install git

# Install Cask
brew install caskroom/cask/brew-cask

Install Casks
brew cask install google-chrome

# Remove outdated versions from the cellar
brew cleanup
```

<div class="alert note">
  <strong>Note:</strong> Since Homebrew and Cask understand interdependencies you can safely use it knowing it will skip previously installed dependencies without crashing your machine.
</div>

Save this file and call it `Homebrew.sh`. Since this is a script you need to change the mode to executable with the following command in Terminal:

```shell
chmod a+x Homebrew.sh
```

Now you can run this script by typing `./Homebrew.sh` in Terminal.

## Conclusion

Homebrew and Casks are amazing tools to have in your toolbox. By crafting a small installer script, you can safely download, compile (if necessary) and automagically install everything you need without worrying about interdependencies hell. This can be really helpful when setting up a new machine by including it with your custom [dotfiles][] repo.

[homebrew]: http://brew.sh/
[macports]: http://www.macports.org/
[fink]: http://www.finkproject.org/
[install homebrew]: http://brew.sh/#install
[dotfiles]: https://github.com/urban/dotfiles
[cask]: http://caskroom.io/
