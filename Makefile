.PHONEY: default build

default: clean
	zola serve

build: clean
	zola build && pnpm gulp

clean:
	rm -rf public
