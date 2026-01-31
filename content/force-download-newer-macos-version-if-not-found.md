+++
title = "Force download newer macOS version if not found"
date = 2026-01-31
draft = true
+++


In my case I wanted to install macOS Monterey, but it didn't show up yet.
Running softwareupdate -l didn't force it.
But, you can also fetch a full installer.
I used this to download the latest:

```bash
softwareupdate --fetch-full-installer --full-installer-version 13.2.1
```
