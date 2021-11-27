---
layout: post
title: Pre-render Syntax Highlighting with Prism in Jekyll
excerpt: "To get a considerable performance boost for this blog, I decided to pre-render all the code when building. So no need for a large JavaScript file."
tags: ["Ruby", "Jekyll", "Prism"]
---

One of the most significant slowdowns of this blog was using [Prism][1] for syntax highlighting of code blocks.
While Prism isn't that big, adding more and more languages can make it grow large.
If you wanted to write blog posts about all languages that Prism could support, you would end up with a 400kb+ monstrosity.
I already have various blogposts for different languages, and I want to write about any language I like.
So I wondered how to achieve this without slowing down my blog for my visitors.

Since the output of Prism is HTML, I started looking into capturing this.
My first attempt was to build a crawler that would go to each blogpost, execute JavaScript, and take the final rendered version to deploy.
While this initially worked, it had a few challenges.
One is the slowness of having to startup and render each page using a headless browser.
Also, each rendered page still included the unwanted `script` tag to Prism.

After doing some more research, I decided to take a whole different approach.
This time I would write my own Jekyll plugin.
It extracts code blocks, passes them to the Prism highlight function, and returns the HTML output.
The Prism highlight function takes three parameters: code, Prism language, code language.
Executing the function would look like this.

```javascript
Prism.highlight(
  'var a = "Hello world!";',
  Prism.languages.javascript,
  "javascript"
);
```

And this would give us HTML with the syntax highlight tags added.

```html
<span class="token keyword">var</span> a <span class="token operator">=</span>
<span class="token string">"Hello world!"</span
><span class="token punctuation">;</span>
```

There are a few ways to achieve this.
One would be to write a custom liquid-tag[^1] which would replace the code block in markdown.
Another would be to listen for the pre-render event using Jekyll [Hooks][2] and then extract the code.
I first went with the Liquid tag option and was successful.
While it worked, all the markdown editors could not understand the custom tags and render a preview.
So I finally decided to go with the hook option.

[Github Pages][3], where I host my blog, doesn't support custom plugins.
So I switched from the `github-pages` gem to the `jekyll` gem and created my build process.

To create a custom plugin, I needed to create a directory in the project root called `_plugins` and place a Ruby file in it.
Jekyll would then load this directory and its contents.
I created a new file called `prism.rb` and placed it in `_plugins`.

Next, I added the [ExecJS][4] gem to the `Gemfile` and ran `bundle install`.
ExecJS lets you run JavaScript code from Ruby. I use this to execute the Prism highlight function and capture its output.

In the `prism.rb` file, we can start adding hooks for events.
The first hook would be to listen to the `pre_render` event on `posts`.
The hook then gives us a `Jekyll::Document` from which we can ask the content of the blog post.
It would look like this.

```ruby
Jekyll::Hooks.register(:posts, :pre_render) do |document|
    content = document.content
end
```

Now that we have the blogpost content, we need to find all the code blocks present in the code.
A code block starts with three backticks, followed by the language, on the following line the code, and ends with three backticks.
I used Regex to get the whole code block, language, and only the code.
Using `String.scan`, we can get all the matches.

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

Now we have everything to call the highlight function.
To call the function, we need to start the JavaScript runtime and load Prism.
First, we need to download Prism JavaScript code.
You can do that [here][5]; while you're at it, download the CSS file you'll need later.
I checked all the languages which you don't have to.
Note that checking all languages makes the file larger, thus making it longer to load and slowing down your build.
My final `prism.min.js` file is a hefty 463kb on the disk; luckily, we don't need to include this on the website!
We can place the file in the `_plugins` directory next to our plugin `prism.rb`.

We then load the contents of our `prism.min.js` and pass it to `ExecJS.compile`.
To do this, you add `require "execjs"` to the top of `prism.rb` and use `File.read` to load the JavaScript file.
We place the loading and compiling of the JavaScript before the code block matching, so we don't have to load it each time we come across a code block.

```ruby
...
file = __dir__ + "/prism.min.js"
source = File.read(file)
js = ExecJS.compile(source)
content.scan /((`{3})(?:\s*)(\w+)((?:.|\n)*?)\2)/ do |match|
...
```

Next, we call the highlight function, using the compiled JavaScript for each of the code blocks.
We then wrap the output with `pre` and `code` HTML tags and replace the code block in the blogpost with our pre-rendered HTML.
Calling the function looks like this.

```ruby
js_code = %Q[Prism.highlight(`#{code}`, Prism.languages.#{language}, '#{language}')]
output = js.eval(js_code)
output = <<~EOS
<pre class="language-#{language}"><code class='language-#{language}'>#{output}</code></pre>
EOS
```

Putting it all together, we get a working version.

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

It works, but it has some bugs.
If a code block contains a backtick, it breaks the call to the highlight function.
So we need to escape special characters before we pass the code along.
We can use the [JSON][6] module for this, and we don't need to wrap it backticks.

```ruby
code = JSON.generate(match[3])
js_code = %Q[Prism.highlight(#{code}, Prism.languages.#{language}, '#{language}')]
```

Finally, we have blogposts with pre-rendered syntax highlighting; without the need for JavaScript.
All that's left is to include the CSS file to get the correct styling.

Future improvements would be to cache each block, so we don't need to render it each time if the code hasn't changed.
Loading and compiling the JavaScript file also adds up to the build, and we could improve this by loading it once for the whole website.
I left these improvements out; else, this blog post would get too long.
Take a look at my current implementation to see the working version behind this blog.
And if you see an improvement feel free to submit an MR!

[1]: https://prismjs.com/
[2]: https://jekyllrb.com/docs/plugins/hooks/
[3]: https://pages.github.com/
[4]: https://github.com/rails/execjs
[5]: https://prismjs.com/download.html
[6]: https://ruby-doc.org/stdlib-2.7.1/libdoc/json/rdoc/JSON.html

*[Regex]: Regular Expressions
*[MR]: Merge Request

[^1]: Liquid is the template rendering within Jekyll 
