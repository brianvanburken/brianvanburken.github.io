+++
title = "Console log lazy evaluation"
date = 2026-01-31
draft = true
+++


Sometimes complex objects aren't correctly logged at the moment you set the value. It is lazy-evaluated later.
Example: Angular control where the value is changed afterwards.

Opzet example

- Maak een formcontrol
- Change value
- Log formcontrol
- Change value
- See browser console

