export EXECJS_RUNTIME=Node

.PHONEY: default build

default: clean
	bundle exec jekyll serve --livereload --drafts --incremental --future

build: clean
	JEKYLL_ENV=production bundle exec jekyll build --verbose --profile --trace && npx gulp

clean: clean_cache
	bundle exec jekyll clean

clean_cache:
	rm -rf .jekyll-cache
