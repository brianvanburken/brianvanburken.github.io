+++
title = "Changing Fish shell theme automatically with OS theme"
date = 2025-06-01
draft = true

[taxonomies]
tags = ["Fish", "shell", "Ghostty"]
+++

I want my Fish shell theme to switch automatically when the OS, in my case macOS, changes themes between dark and light modes.
One wish I had was to not have any extra tools, processes, or dependencies.

I like how Neovim and Ghostty easily changes theme when the OS does so, only my fish shell needed me to manual run a command to change the theme.
So, I went to try to find a way to automate this.

## Research a way

After some searching for a hook or some way to program it, I've come across a discussion on Github for the Ghostty terminal: [#2755](https://github.com/ghostty-org/ghostty/discussions/2755).
In the discussion, users asked GhostTTY to send a notification on theme changes, and maintainers pointed out that terminals should use the VT2031 “palette-update” DSR spec rather than signals like SIGWINCH.
The discussion was closed by a PR that allows the mode 2031 to send updates: [#2771](https://github.com/ghostty-org/ghostty/pull/2771).

TODO: describe on how to see the updates and turn on the mode 2031.

By default GhostTTY won’t send those 997 reports until you turn on Mode 2031.
To enable so, you can print the follwing 
In your Fish startup (~/.config/fish/config.fish), add:

Enable unsolicited “palette-update” DSRs (Mode 2031)

```
printf '\e[?2031h'
```

Per the Contour VT-extensions spec:

Send CSI ?2031 h to enable unsolicited DSR messages for color-palette updates, and CSI ?2031 l to disable them  ￼.

Inspecting the Sequences with fish_key_reader

To see exactly what byte sequence Fish receives, use its helper:

fish_key_reader

    •   Press Enter, then toggle GhostTTY’s theme.
    •   You’ll see something like:

^[[?997;1n

Here ^[ denotes the ESC byte and [?997;1n is the DSR reply for dark mode  ￼.

<TODO a video/gif of it using macOS>

### Crafting the Fish Binds

Fish’s bind needs every byte spelled out with backslashes:
    •   \e → ESC
    •   \[ → literal [
    •   \; → literal ;

Add to ~/.config/fish/config.fish:


## Adding it all together

Let's first define two fish functions to call for each mode.
You can change the themes to whatever you want it to be set.
Having not to ask the user for confirmation, we use the `yes` command to automatically sent.. a `yes` to the confirmation.

```fish
function on_theme_dark
    yes | fish_config theme save "Mono Smoke"
end

function on_theme_light
    yes | fish_config theme save "Mono Lace"
end
```

Then we need to enable the Mode 2031 updates:

```shell
printf '\e[?2031h'
```

Next we can use `bind` to set the right function to call for each of the themes.
```fish
bind \e\[?997\;1n on_theme_dark
bind \e\[?997\;2n on_theme_light
```

Now, reload your shell and try changing to the theme to see it automatically switch in Fish.
