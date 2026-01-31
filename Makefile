.PHONY: default build serve clean drafts-link drafts-unlink

default: serve

serve: clean drafts-link
	mise exec -- zola serve --drafts || true
	$(MAKE) drafts-unlink

build: clean
	mise exec -- zola build && find public/tags -mindepth 1 -type d -exec rm -rf {} + 2>/dev/null || true && pnpm gulp

clean:
	rm -rf public

drafts-link:
	@if [ -d drafts ]; then \
		for f in drafts/*.md; do \
			[ -e "$$f" ] && ln -sf "../$$f" content/$$(basename "$$f"); \
		done; \
	fi

drafts-unlink:
	@if [ -d drafts ]; then \
		for f in drafts/*.md; do \
			[ -e "$$f" ] && rm -f content/$$(basename "$$f"); \
		done; \
	fi
