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
import { convertCode, minifyClassNames } from "./build.js";

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
  for (const [name, html] of Object.entries(PAGES)) {
    await writeFile(join(dir, name), html);
  }
}

/** Runs the real build script against `dir` and returns each page's output. */
async function runBuild(dir) {
  await run(process.execPath, [join(ROOT, "scripts", "build.js")], {
    cwd: ROOT,
    env: { ...process.env, BUILD_DIR: dir },
  });
  const names = (await readdir(dir)).filter((n) => n.endsWith(".html")).sort();
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
