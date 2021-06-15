const gulp = require("gulp"),
  posthtml = require("gulp-posthtml"),
  postcss = require("gulp-postcss"),
  unescapeHtml = require("gulp-unescape-html");

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
      collapseWhitespace: "conservative",
      removeComments: true,
      minifyCss: false,
      minifyJs: false,
    }),
  ];

  return gulp
    .src(source + "/**/*.html")
    .pipe(posthtml(plugins))
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
