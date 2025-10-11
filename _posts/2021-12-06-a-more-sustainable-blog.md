---
layout: post
title: A More Sustainable Blog
extra:
    excerpt: After reading Sustainable Web Design, I started looking for ways to reduce the carbon footprint of this blog.
tags: 
  - HTML
  - Design
  - Sustainablity
---

After reading the book [Sustainable Web Design][1] by Tom Greenwood, I started questioning the impact of this blog on the environment.
While this blog is already efficient by being only static files, it could be improved further.
I added extra build steps using [Gulp][2] that inlines the CSS used on the page, minifies CSS, and shortens classes.
Next, I started pre-compiling the syntax highlighting done by Prism[^1].

After being inspired by the blog post ["A Reality Where CSS and JavaScript Don't Exist"][3] written by Brad Taunt, I started asking myself what part of the CSS of this blog is valuable.
I started from scratch by removing all the CSS.
The primary purpose of this blog is, you guessed it, allowing users to read my blog posts.
So I started adding style around improving the readability of the blog posts.

## Typography

There are many debates on the internet on Serif vs Sans-serif fonts.
Until recently, the consensus was to stick with Sans-serif for screens.
The argument here seems to be that serif fonts were rendered blurry due to the resolutions of screens.
While that was the case years back, nowadays, we have high DPI screens with even thrice the density of pixels compared to back then.
So we can keep the default font family of browsers; serif fonts.

The default font size has always been 16 pixels if the user didn't change it.
While this is legible, I found that the readability improves by tweaking the size to 18 pixels.
Having the content take up the entire width of the browser works if you have a small monitor with a resolution of up to 1024x768.
Nowadays, people have wide and large monitors, yours truly included, and having text spread across the whole screen is painful to read.
We can improve this by limiting the content's width and displaying it like a column, just as text in a book doesn't cross pages.
While we are at it, we can also improve the position of the column by centring it to the middle of the screen.

The last improvement for this section is the default padding the browser applies to the content.
If we don't apply padding to the content, it will touch the viewport border.
It can be better.
Adding small padding to the content fixes this.

The final typography styling:

```css
body {
  font-size: 18px;
  max-width: 80ch;
  margin: 0 auto;
  padding: 1em;
}
```


## Code blocks

This is a tough one.
I feel, personally, that the addition of syntax highlighting improves the readability of code blocks.
It does, however, add significantly more CSS and HTML to a blog post.
I'm still debating the balance of readability and sustainability on this one.
For now, I've decided to keep syntax highlighting.

## Responsive

HTML is already responsive by default but could be improved further.
One point of improvement is scaling images based on the viewport.
A wide image could force mobile users to scroll horizontally.
So adding the following CSS snippet improved that.

```css
img {
  max-width: 100%;
}
```

Another improvement for responsive web design is to make `pre` tags with long lines force a horizontal scroll within its block.
This blog has a few posts that contain code with long lines.
The code would "leak" out of its block without enforcing an overflow and give mobile users a horizontal scrollbar.
With the following CSS, we can fix that:

```css
pre {
  overflow: auto;
}
```

## Dark mode

Sadly, there isn't a default styling in browsers for dark mode.
So, if we want to support dark mode, we need to create our own.
We can detect if the user has dark mode enabled using a media query.
Within the media query, we invert the text and background colours.
The default link colours become unreadable on a dark background, so we must fix those.


```css
@media (prefers-color-scheme: dark) {
  html {
    background: #000;
    color: #fff;
  }

  a {
    color: gold;
  }

  a:visited {
    color: orange;
  }

  a:hover,
  a:focus {
    color: orangered;
  }
}
```

We add dark mode because a dark background saves batterylife which in turn saves the environment a little (every little bit helps!)

## Impact

This blog now is still functional and doesn't overuse CSS and JavaScript.
Nowadays, I see people overusing CSS, JavaScript and even images.
Most blog posts I come across have a large image hero image to portray the blogpost's topic.
But, in many cases, it doesn't have much value, in my opinion.
Instead, it wastes the users' mobile data and electricity in those cases.

Hopefully, I have inspired you to think a bit more about a website's carbon footprint and start making small improvements.

**Update(2022-06-05):** after a discussion with a UX-designer, I've tweaked the design to make it more readable and attractive. I still keep the lessons learned from the book in mind with the update.

[1]: https://abookapart.com/products/sustainable-web-design
[2]: https://gulpjs.com
[3]: https://tdarb.org/css-js-mistake
[4]: https://brianvanburken.nl/pre-render-syntax-highlighting-with-prism-in-jekyll

[^1]: I even wrote a blogpost about this: [Pre-render Syntax Highlighting with Prism in Jekyll][4]
