.PHONEY: default build

BUILD_DIR=public

default: clean
	zola serve

build: clean
	zola build && pnpm gulp && cp CNAME ${BUILD_DIR}/

clean:
	rm -rf ${BUILD_DIR}
