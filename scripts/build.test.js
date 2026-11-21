/**
 * Tests for the build script.
 *
 * Usage: node --test scripts/
 */

import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import {
  convertCode,
  minifyClassNames,
  processAbbreviations,
  processFootnotes,
  stripToBodyMarkup,
} from "./build.js";

const run = promisify(execFile);
const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

const page = (lang, code) =>
  `<html><head></head><body><pre><code data-lang="${lang}">${code}</code></pre></body></html>`;

const PAGES = {
  "elm.html": page("elm", "module A exposing (a)\n\na : Int\na =\n    1\n"),
  "json.html": page("json", "{\n  &quot;a&quot;: 1,\n  &quot;b&quot;: [true, null]\n}\n"),
  "kotlin.html": page("kotlin", "fun main() {\n    println(&quot;hi&quot;)\n}\n"),
  "ruby.html": page("ruby", "class A\n  def b\n    :c\n  end\nend\n"),
  "shell.html": page("shell", "export A=&quot;$HOME/.cache&quot;\ncd /tmp &amp;&amp; ls -la\n"),
  "typescript.html": page("typescript", "const a: number = 1;\nexport default a;\n"),
};

/** Writes the fixture pages plus a stylesheet into a fresh build directory. */
async function writeFixture(dir) {
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "styles.css"), "body{color:#000}\n.unused{color:red}\n");
  await Promise.all(Object.entries(PAGES).map(([name, html]) => writeFile(join(dir, name), html)));
}

/** Runs the real build script against `dir` and returns each page's output. */
async function runBuild(dir) {
  await run(process.execPath, [join(ROOT, "scripts", "build.js")], {
    cwd: ROOT,
    env: { ...process.env, BUILD_DIR: dir },
  });
  const names = (await readdir(dir)).filter((n) => n.endsWith(".html")).toSorted();
  return Object.fromEntries(
    await Promise.all(names.map(async (n) => [basename(n), await readFile(join(dir, n), "utf-8")])),
  );
}

test("repeated builds of the same input produce byte-identical output", async (t) => {
  const scratch = await mkdtemp(join(tmpdir(), "build-test-"));
  t.after(() => rm(scratch, { recursive: true, force: true }));

  const first = join(scratch, "first");
  const second = join(scratch, "second");
  await writeFixture(first);
  await writeFixture(second);

  assert.deepEqual(await runBuild(second), await runBuild(first));
});

test("convertCode does not leak highlighting state between calls", () => {
  // Regression: a shared style-to-class map made a page's class names depend on
  // which other pages had been highlighted first.
  const before = convertCode(PAGES["elm.html"]);
  convertCode(PAGES["kotlin.html"]);
  const after = convertCode(PAGES["elm.html"]);

  assert.deepEqual(after, before);
});

test("convertCode returns only the CSS its own code blocks use", () => {
  const { html, css } = convertCode(PAGES["typescript.html"]);

  const used = new Set(
    Array.from(html.matchAll(/class="([^"]+)"/g)).flatMap((m) => m[1].split(" ")),
  );
  const defined = Array.from(css.matchAll(/\.([\w-]+)\{/g), (m) => m[1]);

  assert.ok(defined.length > 0, "expected at least one generated class");
  assert.deepEqual(
    defined.filter((c) => !used.has(c)),
    [],
  );
});

/** The text a reader sees, i.e. everything outside of tags and stylesheets. */
const visibleText = (html) => html.replace(/<style>[\s\S]*?<\/style>/g, "").replace(/<[^>]*>/g, "");

test("minifyClassNames leaves the text of a code sample untouched", () => {
  // Regression: a code sample that itself contains `class="..."` had that text
  // rewritten as if it were a real attribute, corrupting the rendered sample.
  const sample = 'output = &#x3C;pre class="language-#{lang}">#{body}&#x3C;/pre>\n';
  const { html } = convertCode(page("ruby", sample));
  const document = `<html><head><style>.s0{color:red}</style></head><body>${html}</body></html>`;

  assert.equal(visibleText(minifyClassNames(document)), visibleText(document));
});

test("minifyClassNames still shortens real class attributes and selectors", () => {
  const document =
    "<html><head><style>.token{color:red}</style></head>" +
    '<body><span class="token">x</span></body></html>';

  const out = minifyClassNames(document);

  assert.ok(!out.includes("token"), `expected "token" to be renamed, got: ${out}`);
  assert.match(out, /<style>\.(\w+)\{color:red\}<\/style>[\s\S]*<span class="\1">x<\/span>/);
});

test("code blocks without a known language are left unhighlighted", () => {
  const { html, css } = convertCode(page("text", "just words"));

  assert.equal(html, "<html><head></head><body><pre><code>just words</code></pre></body></html>");
  assert.equal(css, "");
});

test("stripToBodyMarkup keeps only body tags for CSS purging", () => {
  const cases = [
    {
      name: "drops prose so words like `code` do not count as elements",
      html: "<body><p>Some code here</p></body>",
      expected: "<body><p></p></body>",
    },
    {
      name: "drops head metadata",
      html: '<html><head><meta name="description" content="pre code"></head><body></body></html>',
      expected: "<html><body></body></html>",
    },
    {
      name: "drops stylesheets",
      html: "<body><style>blockquote{color:red}</style><p></p></body>",
      expected: "<body><p></p></body>",
    },
    {
      name: "keeps classes and attributes, including after raw `>` in code text",
      html: '<pre><code>a => <span class="s0">b</span>></code></pre>',
      expected: '<pre><code><span class="s0"></span></code></pre>',
    },
    {
      name: "drops noscript fallbacks so a tracking pixel does not count as an image",
      html: '<body><p></p><noscript><img src="/count"></noscript></body>',
      expected: "<body><p></p></body>",
    },
  ];

  for (const { name, html, expected } of cases) {
    assert.equal(stripToBodyMarkup(html), expected, name);
  }
});

/** Zola's markup for footnote 1, referenced in the text and defined at the end. */
const footnoteReference = '<sup class="footnote-reference"><a href="#1">1</a></sup>';
const footnoteDefinition = (body) =>
  `<div class="footnote-definition" id="1"><sup class="footnote-definition-label">1</sup>\n${body}\n</div>`;

test("processFootnotes turns Zola footnotes into linked endnotes", () => {
  const cases = [
    {
      name: "links the reference and moves a paragraph definition into an endnote list",
      html: `<section><p>Text${footnoteReference}.</p>\n${footnoteDefinition("<p>Note</p>")}\n</section>`,
      expected:
        '<section><p>Text<sup id="fnref:1"><a href="#fn:1">1</a></sup>.</p>\n\n' +
        '<ol role="doc-endnotes"><li id="fn:1">\n<p>Note&nbsp;<a href="#fnref:1" role="doc-backlink">↩</a></p>\n</li></ol></section>',
    },
    {
      name: "appends the back-link when the definition has no paragraph",
      html: `<section>${footnoteDefinition("Note")}</section>`,
      expected:
        '<section><ol role="doc-endnotes"><li id="fn:1">\nNote\n<a href="#fnref:1" role="doc-backlink">↩</a></li></ol></section>',
    },
    {
      name: "leaves a page without footnotes untouched",
      html: "<section><p>Text</p></section>",
      expected: "<section><p>Text</p></section>",
    },
  ];

  for (const { name, html, expected } of cases) {
    assert.equal(processFootnotes(html), expected, name);
  }
});

test("processAbbreviations wraps defined terms in abbr tags", () => {
  const cases = [
    {
      name: "keeps the term and wraps it",
      html: "<p>In CI environments.</p>\n<p>*[CI]: Continuous Integration</p>",
      expected: '<p>In <abbr title="Continuous Integration">CI</abbr> environments.</p>\n',
    },
    {
      name: "reads every definition from one multi-line paragraph",
      html: "<p>DNA and RNA.</p>\n<p>*[DNA]: DeoxyriboNucleic Acid\n*[RNA]: RiboNucleic Acid</p>",
      expected:
        '<p><abbr title="DeoxyriboNucleic Acid">DNA</abbr> and <abbr title="RiboNucleic Acid">RNA</abbr>.</p>\n',
    },
    {
      name: "wraps every occurrence in a text node",
      html: "<p>CI, CI.</p><p>*[CI]: Continuous Integration</p>",
      expected:
        '<p><abbr title="Continuous Integration">CI</abbr>, <abbr title="Continuous Integration">CI</abbr>.</p>',
    },
    {
      name: "skips attributes, code and partial words",
      html: '<p><a href="/CI">CICD</a> <code>CI</code></p><p>*[CI]: Continuous Integration</p>',
      expected: '<p><a href="/CI">CICD</a> <code>CI</code></p>',
    },
    {
      name: "leaves a page without definitions untouched",
      html: "<p>CI</p>",
      expected: "<p>CI</p>",
    },
  ];

  for (const { name, html, expected } of cases) {
    assert.equal(processAbbreviations(html), expected, name);
  }
});
