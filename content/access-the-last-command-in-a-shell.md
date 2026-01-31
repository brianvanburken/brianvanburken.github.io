+++
title = "Access the last argument of the last command in a shell"
date = 2022-12-26


[extra]
tags = ["Shell"]
excerpt = "Using `$_`, you can access the last argument of the last command executed."
+++

Using `$_`, you can access the last argument of the last command executed.

Example:

```
$ echo "Have a nice day!"
Have a nice day!

$ echo $_
Have a nice day!
```
