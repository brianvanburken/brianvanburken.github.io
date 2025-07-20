---
title: Wrap visual selection using the vim-surround plugin
extra:
    excerpt: One nice thing I've discovered using the vim-surround plugin for vim is that you can wrap a visual selection.
---

One nice thing I've discovered using the [vim-surround][1] plugin for vim is that you can wrap a visual selection.

The `S` key lets you wrap the visual selection with the input afterwards.

For example, the following text when visually selected in vim:

```
Hello world
```

After pressing `S` followed up by `"` will result in the following:

```
"Hello world"
```

It works as well with `(` and `[`. And one more great thing is that it also works with HTML tags!
Given the same text as before, pressing `S` and then typing `<b>` will create:

```
<b>Hello world<b>
```

It pays to sometimes dive into the documentation by typing `:help surround` or in the [source code][2] to find better ways.

[1]: https://github.com/tpope/vim-surround
[2]: https://github.com/tpope/vim-surround/blob/master/doc/surround.txt
