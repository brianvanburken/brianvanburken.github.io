---
layout: post
title: Disable NPM fund message
excerpt: If you find NPM's funding messages distracting, you can disable them by setting a configuration in different ways.
tags:
  - Shell
---

Whenever you install packages using NPM, you get a message that the packages seek funding.
This functionality was introduced back in NPM version [6.13][0].
It looks like this:

```
$ npm install
3 packages are looking for funding.
Run "npm fund" to find out more.
```

Running `npm fund` shows which packages are looking for funding.
Here is a quick preview of what the output looks like:

```
$ npm fund
tmp@1.0.0
├─┬ fund-dev-dep@1.0.0
│ ├── type: dev dep
│ └── url: http://example.com/fund
├─┬ fund-project@1.0.0
│ ├── type: individual
│ └── url: https://example.com/project/support
└─┬ sub-fund-foo@1.0.0
  ├── type: corporate
  └── url: https://corp.example.com/sponsor
```


While the idea is excellent, you should always [support open-source projects][1] in any way possible!
It can generate unwanted noise, especially in CI environments.
If you want, you can disable it by running the following command:

```bash
npm config set fund false
```

Or add the following line manually to your [`.npmrc`][2].

```ini
fund=false
```

Or expose it as a shell environment variable:

```bash
export NPM_CONFIG_FUND=false
```

Or, if you want to run it once, disable it for installation using the flag `--no-fund`:

```bash
npm install --no-fund
```

## Bonus tip:

While these fund messages are one of the many ways these messages get displayed in the terminal, you can [add the following][3] to your shell to disable those as well.

```bash
export ADBLOCK=true
export DISABLE_OPENCOLLECTIVE=true
export OPEN_SOURCE_CONTRIBUTOR=true
```

*[CI]: Continuous Integration

[0]: https://blog.npmjs.org/post/188841555980/updates-to-community-docs-more
[1]: https://opensource.guide
[2]: https://docs.npmjs.com/cli/v9/configuring-npm/npmrc
[3]: https://news.ycombinator.com/item?id=20791266
