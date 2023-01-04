---
layout: post
title: Access the last command in a shell
tag: Command-line
---

Using `!!`, you can access the last command executed.
Useful for rerunning a command with `sudo`-privilege.

Example:

```
$ make_me_a_sandwich
What? Make it yourself
```

Rerun it using `!!`

```
$ sudo !!
$ sudo make_me_a_sandwich
Okay.
```
