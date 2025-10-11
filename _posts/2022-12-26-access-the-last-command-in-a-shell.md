---
layout: post
title: Access the last argument of the last command in a shell
extra:
    excerpt: Using `$_`, you can access the last argument of the last command executed.
tags:
  - Shell
---

Using `$_`, you can access the last argument of the last command executed.

Example:

```
$ echo "Have a nice day!"
Have a nice day!

$ echo $_
Have a nice day!
```
