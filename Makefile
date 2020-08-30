export EXECJS_RUNTIME=Node

.PHONEY: default build

default:
	bundle exec jekyll serve --livereload --drafts --incremental

build: clean
	JEKYLL_ENVIRONMENT=production bundle exec jekyll build --verbose --profile --trace

clean:
	bundle exec jekyll clean
