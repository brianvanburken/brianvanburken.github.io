---
title: Caching Elm dependencies on Github Actions
extra:
    excerpt: Caching dependencies efficiently can significantly speed up CI runs and improve reliability, as it prevents downloading dependencies every time, reducing exposure to outages and network failures.
---

When working with Elm in GitHub Actions, caching dependencies efficiently can significantly speed up CI runs and improve reliability, as it prevents downloading dependencies every time, reducing exposure to outages and network failures.

## Where does Elm store its dependencies?

Elm stores downloaded dependencies inside a hidden `.elm` directory in the user’s home folder by default. On most systems, this directory is located at:

```sh
~/.elm
```

We can change the location where dependencies are stored by setting the `ELM_HOME` environment variable in your shell. This allows us to relocate the `.elm` directory to a location we control.

For example, we can move it to follow the [XDG Base Directory Specification](https://specifications.freedesktop.org/basedir-spec/latest/):

```sh
export ELM_HOME="$HOME/.cache/elm"
```

## How can we only install Elm dependencies?

Unlike other package managers, Elm does not have a separate install command to fetch dependencies without compiling a project. Dependencies are only downloaded when Elm compiles a file in the project. Compiling the entire project could work, but it may be slow. However, there is a trick to circumvent this.

### Using a temporary file

A workaround is to create a minimal valid Elm file that triggers dependency installation without requiring the compilation of the entire project. Below is an example:

```elm
module A exposing (a)
a = 0
```

Then, we create this file and compile it to download dependencies without affecting the main project. The compilation result is directed to `/dev/null`, so it is discarded automatically without leaving any artifacts:

```sh
elm make Temp.elm --output=/dev/null
```

### No Lockfile?

Elm does not have the concept of a “lockfile.” Instead, the `elm.json` file stores exact package versions. This means we can base the cache on the `elm.json` file. However, one downside is that any modification to elm.json—such as changing the Elm package version—will trigger a cache invalidation, even if dependencies remain unchanged.

## Adding caching to GitHub Actions

Now, let’s put everything together in a GitHub Actions pipeline.

### 1. Set the `ELM_HOME` Environment Variable

Modify your GitHub Actions workflow to define the `ELM_HOME` path at the root level for consistency across runs. Here, we set it to the project’s root:

```yaml
env:
  ELM_HOME: ".elm"
```

### 2. Add a cache rule for the `.elm` directory

Use the [GitHub cache action](https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/caching-dependencies-to-speed-up-workflows) to persist dependencies between workflow runs.
This should go in the `steps:` section of the workflow file.

```yaml
- name: Cache Elm dependencies
  id: elm_cache
  uses: actions/cache@v3
  with:
    path: .elm
{% raw %}    key: elm-${{ runner.os }}-${{ hashFiles('elm.json') }}{% endraw %}
```

This ensures that dependencies are only redownloaded when `elm.json` changes, as its content is used as the cache key. We set an `id` so that we can reference it to check for cache hits.

### 3. Install dependencies using the temporary file trick

To ensure all dependencies are installed before the main build step, use the following command to create a temporary file and compile it, forcing dependency installation.
This should also be included in the `steps:` section of the workflow file.

```yaml
- name: Install Elm dependencies
  if: steps.elm_cache.outputs.cache-hit != 'true'
  run: |
    echo "module A exposing (a)\na=0" > Temp.elm
    elm make Temp.elm --output=/dev/null
    rm Temp.elm
```

This step will be skipped if the cache is hit, meaning `elm.json` has not changed.
