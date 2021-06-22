const gulp = require("gulp"),
  posthtml = require("gulp-posthtml"),
  postcss = require("gulp-postcss"),
  unescapeHtml = require("gulp-unescape-html");
const htmlMinimizer = require("gulp-html-minimizer");

const source = process.env.BUILD_DIR || "_site";

const prismClasses = [];

gulp.task("html", function () {
  const plugins = [
    require("posthtml-external-link").posthtmlExternalLink(),
    require("posthtml-inline-assets")({
      cwd: __dirname + "/" + source,
      root: __dirname + "/" + source,
    }),
    require("posthtml-minify-classnames")({
      filter: new RegExp("^(" + prismClasses.concat("#.").join("|") + ")"),
    }),
    require("htmlnano")({
      collapseWhitespace: "aggressive",
      removeComments: true,
    }),
  ];

  return gulp
    .src(source + "/**/*.html")
    .pipe(posthtml(plugins))
    .pipe(uncssStyles())
    .pipe(
      htmlMinimizer({
        removeOptionalTags: true,
      })
    )
    .pipe(gulp.dest(source));
});

gulp.task("css", function () {
  const csso = require("postcss-csso")({
    forceMediaMerge: true,
    comments: false,
  });
  const plugins = [
    csso,
    require("@fullhuman/postcss-purgecss")({
      content: [source + "/**/*.html"],
      safelist: prismClasses.map((c) => c.replace(".", "")),
    }),
    csso,
  ];

  return gulp
    .src(source + "/**/*.css")
    .pipe(postcss(plugins))
    .pipe(gulp.dest(source));
});

gulp.task("default", gulp.series(["css", "html"]));

const uncss = require("uncss");
const through = require("through2");

function uncssStyles() {
  return through.obj(function (file, encoding, cb) {
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
            content.replace(styleSelector, `<style>${output}</style>`)
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
