.PHONY: default build serve clean

default: serve

serve: clean
	zola serve --drafts

build: clean
	zola build && pnpm gulp

clean:
	rm -rf public
