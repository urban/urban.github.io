---
title: Using tmux
date: "2013-09-24T16:00:00.000Z"
layout: post
category: Programming
tags: [Tools, CLI]
description: " [tmux](http://tmux.sourceforge.net/) is a terminal multiplexer, meaning it allows you to run multiple terminal _sessions_, each composed of _windows_ which can be split both vertically and horizontally into _panes_."
---

I recently came across several [getting started][1] articles on [tmux][2] and decided to augment my existing workflow to take advantage of it. After getting over the initial hurdle of learning the [tmux specific commands][3], things have been great. Below is a brief overview of what `tmux` is, how to use it and also highlight some of it's&nbsp;features.

## Sessions

`tmux` is a terminal multiplexer, meaning it allows you to run multiple virtual terminal sessions. Sessions are completely separate work environments. I create different named sessions for each project I'm working on. This is useful because as long as you don't re-boot your computer, you can _detach_ from the session and _attach_ to the session at will while preserved context: _working directories_, _command history_ and&nbsp;_processes_.

```
# start new
tmux

# starts a new session session_name
tmux new -s session_name (prefix + :new -s session_name)

# starts a new session name the same as current directory
tmux new -s `basename $PWD`

# attach
tmux a # (or at, or attach)

# attach to an existing session named session_name
tmux attach -t session_name
tmux a -t session_name

# switch to an existing session named session_name
tmux switch -t session_name

# lists existing sessions
tmux list-sessions (prefix + s)
tmux ls

# detach the currently attached session
tmux detach (prefix + d)

# kill session
tmux kill-session -t session_name

# rename session
prefix + $
```

## Windows

Each session can have multiple windows that provide a tabbing interface. With them you can quickly move switch windows using keyboard shortcuts similar to how you `Alt+Tab` between OS&nbsp;windows.

```
# create a new window
prefix + c

# list windows / window numbers
prefix + w

# move to the window based on index
prefix + 0-9

# rename the current window
prefix + ,

# kill the current window
prefix + &
```

## Panes

Panes allow you to split your _windows_ into multiple _panes_ both vertically and horizontally. This is great for viewing multiple command line utilities or scripts in development without hiding them behind tabs or making them background&nbsp;processes.

```
# split the window into two vertical panes
prefix + "

# split the window into two horizontal panes
prefix + %

# swap pane with another in the specific direction
prefix + { or }

# select the next pane in the specified direction (arrow keys)
prefix + [UDLR]

# toggle between pane layouts (space key)
prefix + ⍽

# for scrolling, enter copy-mode and then use arrow keys and exit w/ ESC
prefix + [

# kill the current pane
prefix + x
```

## Configuration

Out of the box `tmux` has sane defaults however you can customize it with your own configuration file. Below is my `~/.tmux.conf`&nbsp;file.

```
# utf8
set-window-option -g utf8 on

# fix the titles
set -g set-titles on
set -g set-titles-string "#I:#W"

# 1-based window indexing
set -g base-index 1

# switch currently focused pane by mouse click
setw -g mode-mouse on
set-option -g mouse-select-pane on

# increase history to 100k
set -g history-limit 100000

# aggressive resize
setw -g aggressive-resize on

# load custom key bindings
source-file ~/.tmux.keys
```

And my `~/.tmux.keys`&nbsp;file.

```
# remap prefix to match GNU screen (i.e. CTRL+a)
set -g prefix C-a
unbind C-b
bind C-a send-prefix

# force a reload of the config file
unbind r
bind r source-file ~/.tmux.conf

# quick pane cycling
unbind ^A
bind ^A select-pane -t :.+

# make the split panes more mnemonic
unbind '"'
unbind %
bind \ split-window -h
bind - split-window -v
```

## Workflow

I often work on several different client and personal projects throughout the day. By naming both my `tmux` sessions and windows, I'm able to switch between them quickly and get back to right where I left off with my preserved command history in each pane. In addition, I usually split my windows into 2-3 panes so I have visibility of the `stdout` and `stderr` streams from my development tools. This gives me visibility into what's happening vs. hiding them with background processes or terminal&nbsp;tabs.

## Conclusion

Adding `tmux` to my development workflow has been a great improvement over what I was doing, making me more productive. Hopefully you'll find it as useful as I&nbsp;have.

[1]: https://www.google.com/webhp?sourceid=chrome-instant&ie=UTF-8#hl=en&output=search&sclient=psy-ab&q=tmux%20tutorial&oq=&gs_l=&pbx=1&fp=45c3b9a0a6db80f8&bav=on.2,or.r_gc.r_pw.r_cp.r_qf.,cf.osb&biw=1110&bih=825
[2]: http://tmux.sourceforge.net/
[3]: https://gist.github.com/MohamedAlaa/2961058
