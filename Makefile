.PHONY: default build serve clean

default: serve

serve: clean drafts-link
	mise exec -- zola serve --drafts || true

build: clean
	mise exec -- zola build && node build.js

clean:
	rm -rf public
