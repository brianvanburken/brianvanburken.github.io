export EXECJS_RUNTIME=Node

.PHONEY: default build

default:
	bundle exec jekyll serve --livereload --drafts

build:
	JEKYLL_ENVIRONMENT=production bundle exec jekyll build --verbose --profile

