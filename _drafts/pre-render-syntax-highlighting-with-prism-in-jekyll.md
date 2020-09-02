---
layout: post
title: Pre-render Syntax Highlighting with Prism in Jekyll
excerpt: "To get a huge performance boost for this site I decided to pre-render
all the code when building. So no need for a large JavaScript file."
tags: ["Ruby", "Jekyll", "Prism"]
---

One of the biggest slowdown of this blog was using [Prism][1] for syntax
higlighting of code blocks. While Prism isn't that big, adding more and more
languages it can become really large. If you wanted to write blogposts about all
the langauges that Prism supports you end up with a 400kb+ monstrosity. I do
already have a few diverse blogposts for some languages and want to write about
any language I like. So I wondered how to achieve this without a slowing down my
blog for my visitors.

Since the output of Prism is just HTML I started looking into capturing this. My
first attempt was to build a crawler which would go to each blogpost, execute
JavaScript, and take the final rendered version to deploy. While this worked it
had a few challenges. One is the slowness of a having to startup and render of
each page using a headless browser. Each rendered page still included the
`script` tag to Prism which needed to be removed.

After doing some more research I decided to take a while different approach.
This time I would write a Jekyll-plugin which takes the blogpost and extracts
each code block, passes it to the Prism highlight function, and put back the
output. The Prism highlight function takes three parameters: code, Prism
language, code language. Executing the function would look like this.

```javascript
Prism.highlight('var a = "Hello world!";', Prism.languages.javascript, 'javascript');
```

And this would give us HTML with the special syntax highlight tags added.

```html
<span class="token keyword">var</span> a <span class="token operator">=</span> <span class="token string">"Hello world!"</span><span class="token punctuation">;</span>
```

There are a few options to achieve this. One would be to write a custom
liquid-tag (Liquid is the template rendering within Jekyll) which would replace
the code block in markdown. Another would be to listen for the pre-render event
using Jekyll [Hooks][2] and then extract the code. I first went with the Liquid
tag option and was successful. While it worked, all the markdown-editors could
not understand the special tag and render a preview. So I decided to go with the
hook option.

Since this blog is hosted on [Github Pages][3], and Github Pages doesn't support
custom plugins, I had to switch from the `github-pages` gem to the normal
`jekyll` gem and create my own build process. I won't go into further details
about this, maybe in a future blogpost.

To create a custom plugin all I needed was to create a directory in the
project root called `_plugins` and place a Ruby file in it. Jekyll would then
load this directory and its contents automatically. I created a new file called
`prism.rb` and placed it in `_plugins`.

Next I added the [ExecJS][4] gem to the `Gemfile` and ran `bundle install`.
ExecJS lets you run JavaScript code from Ruby. This is needed to execute the
Prism highlight function and capture its output.

In the `prism.rb` file we can start adding hooks for events. The first hook
would be to listen to the `pre_render` event on `posts`. The hook then gives us
a `Jekyll::Document` from which we can ask the content of the blogpost. It would
look like this.

```ruby
Jekyll::Hooks.register(:posts, :pre_render) do |document|
    content = document.content
end
```

Now that we have the blogpost content we need to find all the code blocks
present in the code. A code block starts with three backticks, followed by the
language, on the next lines the code, and ends with three backticks on a line.
I used Regex to get the whole code block, language, and only the code. Using
`String.scan` we can get all the matches.

```ruby
Jekyll::Hooks.register(:posts, :pre_render) do |document|
    content = document.content
    content.scan /((`{3})(?:\s*)(\w+)((?:.|\n)*?)\2)/ do |match|
        code_block = match[0]
        language = match[2]
        code = match[3]
    end
end
```

Now we have everything to call the highlight function. To call the function we
need to start the JavaScript runtime and load Prism. First we need to download
Prism JavaScript code. You can do that [here][5]; while you're at it also download
the CSS file which you'll need later. I checked all the languages which you don't
have to. Do note here that checking all languages does make the file larger,
thus taking it longer to load, and slowing down your build. My final
`prism.min.js` file is a hefty 463kb on the disk; luckily we don't need to
include this on the website! We can place the file in the `_plugins` directory
next to our plugin `prism.rb`.

We then load the contents of our `prism.min.js` and pass it to `ExecJS.compile`.
To do this you add `require "execjs"` to the top of `prism.rb` and use
`File.read` to load the JavaScript file. We place the loading and compiling of
the JavaScript before the code block matching so we don't have to load it each
time we get come across a code block.

```ruby
...
file = __dir__ + "/prism.min.js"
source = File.read(file)
js = ExecJS.compile(source)
content.scan /((`{3})(?:\s*)(\w+)((?:.|\n)*?)\2)/ do |match|
...
```

Next, we call the highlight function, using the compiled JavaScript, for each of
the code blocks. We then wrap the output with `pre` and `code` HTML tags and
replace the code block in the blogpost with our pre-rendered HTML. Calling the
function looks like this.

```ruby
js_code = %Q[Prism.highlight(`#{code}`, Prism.languages.#{language}, '#{language}')]
output = js.eval(js_code)
output = <<~EOS
<pre class="language-#{language}"><code class='language-#{language}'>#{output}</code></pre>
EOS
```

Putting it all together we get a working version.

```ruby
require "execjs"

Jekyll::Hooks.register(:posts, :pre_render) do |document|
    content = document.content
    file = __dir__ + "/prism.min.js"
    source = File.read(file)
    js = ExecJS.compile(source)
    content.scan /((`{3})(?:\s*)(\w+)((?:.|\n)*?)\2)/ do |match|
        code_block = match[0]
        language = match[2]
        code = match[3]
        js_code = %Q[Prism.highlight(`#{code}`, Prism.languages.#{language}, '#{language}')]
        output = js.eval(js_code)
        output = <<~EOS
        <pre class="language-#{language}"><code class='language-#{language}'>#{output}</code></pre>
        EOS
        content = content.gsub code_block, output
    end
    document.content = content
end
```

This works, but, it has some bugs. If a code block contains a backtick it breaks
the call to the highlight function. So we need to escape special characters
before we pass it along. We can use the [JSON][6] module for this and we don't
need to wrap it backticks.

```ruby
code = JSON.generate(match[3])
js_code = %Q[Prism.highlight(#{code}, Prism.languages.#{language}, '#{language}')]
```

Finally we have blogposts with the pre-rendered syntax highlighting and no need
for a big JavaScript file. All that's left is to include the CSS file to get the
correct styling.

Future improvements to the code would be to cache each code block so we don't
need to render it each time if the code hasn't changed. Loading and compiling the
JavaScript file also adds up to the build and we could improve this by loading
it once for the whole website. I left these improvements out else this blogpost
would get to long. Take a look at my current implementation to see the working
version behind this blog. And if you see an improvement feel free to submit a
PR!

[1]: https://prismjs.com/
[2]: https://jekyllrb.com/docs/plugins/hooks/
[3]: https://pages.github.com/
[4]: https://github.com/rails/execjs
[5]: https://prismjs.com/download.html
[6]: https://ruby-doc.org/stdlib-2.7.1/libdoc/json/rdoc/JSON.html

*[Regex]: Regular Expressions
