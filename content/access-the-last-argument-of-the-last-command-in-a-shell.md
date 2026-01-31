+++
title = "Access the last command in a shell"
date = 2022-12-26

[taxonomies]
tags = ["Shell"]

[extra]
excerpt = "Using !!, you can access the last command executed. Useful for rerunning a previous command."
+++

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
