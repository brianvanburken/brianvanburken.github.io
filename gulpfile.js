import gulp from "gulp";
import htmlMinimizer from "gulp-html-minimizer";
import htmlnano from "htmlnano";
import postHtmlExternalLink from "posthtml-external-link";
import postHtmlInlineAssets from "posthtml-inline-assets";
import postHtmlMinifyClassnames from "posthtml-minify-classnames";
import postcss from "gulp-postcss";
import postcssCsso from "postcss-csso";
import purgeCSSPlugin from '@fullhuman/postcss-purgecss';
import posthtml from "gulp-posthtml";
import replace from "gulp-replace-string";
import through from "through2";
import uncss from "uncss";
import { createHighlighter } from "shiki";
import { transform } from "gulp-html-transform";
import { deleteSync } from "del";

const source = process.env.BUILD_DIR || "public";
const dirname = new URL(".", import.meta.url).pathname;
const theme = "ayu-dark";
const highlighter = await createHighlighter({
  themes: [theme],
  langs: [
    "css",
    "diff",
    "elixir",
    "elm",
    "html",
    "ini",
    "javascript",
    "json",
    "kotlin",
    "ruby",
    "typescript",
    "shell",
  ],
});

function uncssStyles() {
  return through.obj(function (file, _encoding, cb) {
    if (file.isNull() || !file.isBuffer()) {
      return cb(null, file);
    }

    try {
      const content = String(file.contents);
      const styleSelector = /<style>(.*?)<\/style>/;
      const matches = styleSelector.exec(content);
      if (!matches) {
        return cb(null, file);
      }
      const css = matches[1];
      const html = content.replace(styleSelector, "");

      uncss(html, { raw: css }, (error, output) => {
        if (output) {
          file.contents = Buffer.from(
            content.replace(styleSelector, `<style>${output}</style>`),
          );
          cb(null, file);
        } else {
          cb(error, null);
        }
      });
    } catch (e) {
      return cb(e, file);
    }
  });
}

// Process footnotes to match Jekyll's structure
async function processFootnotes($) {
  // Find all footnote references and update IDs/hrefs to Jekyll format
  $("sup > a[href^='#']").each(function () {
    const $link = $(this);
    const href = $link.attr("href");
    const match = href.match(/^#(\d+)$/);
    if (match) {
      const fnId = match[1];
      const $sup = $link.parent();
      $sup.attr("id", `fnref:${fnId}`);
      $link.attr("href", `#fn:${fnId}`);
    }
  });

  // Collect all footnote divs
  const footnoteDivs = [];
  $("div[id]").each(function () {
    const $div = $(this);
    const id = $div.attr("id");
    if (/^\d+$/.test(id)) {
      footnoteDivs.push({ id, $div });
    }
  });

  if (footnoteDivs.length === 0) return;

  // Create the Jekyll-style footnotes wrapper
  const $wrapper = $('<div role="doc-endnotes"><ol></ol></div>');
  const $ol = $wrapper.find("ol");

  // Convert each footnote div to a list item
  footnoteDivs.forEach(({ id, $div }) => {
    // Remove the <sup>N</sup> at the start
    $div.find("sup").first().remove();

    // Get the content and find the last <p> to insert the back link
    const $lastP = $div.find("p").last();
    if ($lastP.length) {
      $lastP.append(`&nbsp;<a href="#fnref:${id}" role="doc-backlink">↩</a>`);
    } else {
      // If no <p>, just append the back link
      $div.append(`<a href="#fnref:${id}" role="doc-backlink">↩</a>`);
    }

    // Create list item with Jekyll-style ID
    const $li = $(`<li id="fn:${id}"></li>`);
    $li.append($div.contents());

    $ol.append($li);

    // Remove the original div
    $div.remove();
  });

  // Insert the wrapper where the first footnote was (or at end of article/body)
  const $article = $("article");
  if ($article.length) {
    $article.find("section").append($wrapper);
  } else {
    $("body").append($wrapper);
  }
}

// Process markdown abbreviations (*[ABBR]: Definition)
async function processAbbreviations($) {
  const abbreviations = {};
  const abbrRegex = /\*\[([^\]]+)\]:\s*(.+)/g;

  // Find all abbreviation definitions (may be in a single <p> with newlines)
  $("p").each(function () {
    const text = $(this).text();
    let match;
    let hasAbbr = false;

    while ((match = abbrRegex.exec(text)) !== null) {
      abbreviations[match[1]] = match[2].trim();
      hasAbbr = true;
    }
    abbrRegex.lastIndex = 0; // Reset regex state

    // Remove paragraph if it only contains abbreviation definitions
    if (hasAbbr) {
      const cleanedText = text.replace(/\*\[[^\]]+\]:\s*.+/g, "").trim();
      if (cleanedText === "") {
        $(this).remove();
      }
    }
  });

  // Replace abbreviations in text nodes
  if (Object.keys(abbreviations).length > 0) {
    const replaceInText = (node) => {
      if (node.type === "text" && node.data) {
        let text = node.data;
        for (const [abbr, title] of Object.entries(abbreviations)) {
          // Use word boundary to avoid partial matches, escape special regex chars
          const escapedAbbr = abbr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const regex = new RegExp(`\\b${escapedAbbr}\\b`, "g");
          text = text.replace(regex, `<abbr title="${title}">${abbr}</abbr>`);
        }
        if (text !== node.data) {
          $(node).replaceWith(text);
        }
      }
    };

    // Process text nodes in the body, but not in code/pre/script/style
    $("body *")
      .not("code, pre, script, style, abbr")
      .contents()
      .each(function () {
        replaceInText(this);
      });
  }
}

async function convertCode($) {
  $("code").each(function () {
    const $code = $(this);
    const $parent = $code.parent();
    const isInlineCode = $parent[0].name !== "pre";
    const cls = $code.attr("class");
    const dataLang = $code.attr("data-lang");
    const lang = dataLang ? dataLang : (cls ? cls.toString().replace("language-", "").trim() : "text");
    const content = $code.text();

    const highlighted = highlighter.codeToHtml(content, {
      lang,
      theme,
    });

    if (isInlineCode) {
      $code.attr("style", $(highlighted).attr("style"));
    } else {
      $parent.replaceWith(`<pre>${highlighted}</pre>`);
    }
  });

  // Now we replace all inline styles with classes to save space
  let css = "";
  let css_map = {};
  $("*[style]").each(function (index) {
    const style_content = $(this).attr("style").trim();
    const styles = style_content.split(";");

    for (let i = 0; i < styles.length; i++) {
      const style_key = styles[i].replace(/[\s;]/g, "").toUpperCase();

      const class_name = css_map.hasOwnProperty(style_key)
        ? css_map[style_key]
        : `shiki_${index}_${i}`;

      css += ` .${class_name} { ${styles[i]}; }\n`;
      css_map[style_key] = css_map[style_key] || class_name;

      $(this).addClass(class_name);
      $(this).removeAttr("style");
    }
  });
  const style_tag = $(`<style type="text/css">${css}</style>`);
  $("body").append(style_tag);

  // Remove color class and wrapper that is the same as default set on code/pre tags
  const DEFAULT_COLOR_KEY = "COLOR:#BFBDB6";
  const default_color_class = css_map[DEFAULT_COLOR_KEY];
  default_color_class &&
    $(`.${default_color_class}`).each(function () {
      $(this).removeClass(default_color_class);
    });

  $("pre > pre").each(function () {
    const content = $(this).parent().html();
    $(this).parent().replaceWith(content);
  });

  // Remove empty span tags created by Shiki
  $("span:empty").remove();

  // Remove wrapper span tags created by Shiki
  $("span > span:first-child").each(function () {
    const content = $(this).parent().html();
    $(this).parent().replaceWith(content);
  });

  $("span").each(function () {
    // Remove wrapper spans around whitespace
    const content = $(this).text();
    if (content.trim() === "") {
      $(this).replaceWith(content);
    }

    // Remove span around code without any style
    if (!$(this).attr("class") && !$(this).attr("style")) {
      const html = $(this).html();
      $(this).replaceWith(html);
    }
  });

  // Remove italic code generated by Shiki
  const ITALIC_KEY = "FONT-STYLE:ITALIC";
  const default_italic_class = css_map[ITALIC_KEY];
  default_italic_class &&
    $(`.${default_italic_class}`).each(function () {
      $(this).removeClass(default_italic_class);
    });

  // Remove background color on pre/code
  const BG_KEY = "BACKGROUND-COLOR:#0B0E14";
  const default_bg_class = css_map[BG_KEY];
  default_bg_class &&
    $(`.${default_bg_class}`).each(function () {
      $(this).removeClass(default_bg_class);
    });
}

gulp.task('clean', function(cb) {
  deleteSync([source + '/**/*.css']);
  cb();
});

gulp.task("html", function () {
  const plugins = [
    postHtmlExternalLink.posthtmlExternalLink(),
    postHtmlInlineAssets({
      cwd: dirname + "/" + source,
      root: dirname + "/" + source,
    }),
    postHtmlMinifyClassnames({
      genNameId: false,
    }),
    htmlnano({
      collapseWhitespace: "aggressive",
      removeComments: true,
      removeEmptyAttributes: true,
      removeAttributeQuotes: true,
      mergeStyles: true,
    }),
  ];

  const regex =
    /<span class="([a-z0-9_]+)">([^<]*)<\/span>(\s*)<span class="\1">/gm;

  return (
    gulp
      .src(source + "/**/*.html")
      .pipe(transform(processFootnotes))
      .pipe(transform(processAbbreviations))
      .pipe(transform(convertCode))

      // Compress spans where next span has same class so lines with similair colors
      // fall under a single <span>
      // e.g. <span class="e">a</span> <span class="e">b</span>
      .pipe(replace(regex, '<span class="$1">$2$3'))
      // Do it again to ensure any extra are missed
      .pipe(replace(regex, '<span class="$1">$2$3'))

      .pipe(uncssStyles())
      .pipe(posthtml(plugins))
      .pipe(
        htmlMinimizer({
          removeOptionalTags: true,
        }),
      )
      .pipe(uncssStyles())
      .pipe(gulp.dest(source))
  );
});

gulp.task("css", function () {
  const csso = postcssCsso({
    forceMediaMerge: true,
    comments: false,
  });
  const plugins = [
    csso,
    purgeCSSPlugin({
      content: [source + "/**/*.html"],
    }),
    csso,
  ];

  return gulp
    .src(source + "/**/*.css")
    .pipe(postcss(plugins))
    .pipe(gulp.dest(source));
});

gulp.task("default", gulp.series(["css", "html", "clean"]));
