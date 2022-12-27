---
layout: post
title: Using :read in Vim
tag: vim
---

The vim command [`:read`][1] (or shorter `:r`) allows you to input anything from a file into the current buffer.
Useful if you want to copy things from another file.
For example, the following command `:read template.md` will load the entire content of the file `template.md` into the buffer.

You can even combine it with the `!` command to instead output the result of the shell command.
E.g. `:r ! ls`, will put the output of [`ls`][2], the list of all files and directories in the current folder, into the buffer.

[1]: https://vimdoc.sourceforge.net/htmldoc/insert.html#:read
[2]: https://man7.org/linux/man-pages/man1/ls.1.html
