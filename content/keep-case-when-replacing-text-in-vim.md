+++
title = "Keep case when replacing text in Vim using vim-abolish"
date = 2023-01-03


[extra]
tags = ["Vim"]
excerpt = "vim-abolish is a plugin that allows users to easily search for and replace text while also providing the option to keep the original case of the text."
+++

[vim-abolish][1] is a plugin that allows users to easily search for and replace text while also providing the option to keep the original case of the text.
You can use the `:Subvert` or shortened `:S` command. It acts as a replacement for the default search command.

For example, to replace all occurrences of the word "cat" with the word "dog", regardless of the case of the text, you would enter the following command:

`:%S/cat/dog/gi`

All occurrences of "cat" or "Cat" or "CAT" will be replaced with "dog" while keeping the case intact, so "Cat" becomes "Dog" and "CAT" becomes "DOG".

[1]: https://github.com/tpope/vim-abolish
