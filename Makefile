.PHONEY: default build

BUILD_DIR=public

default: clean
	zola serve

build: clean
	zola build && pnpm gulp && cp CNAME ${BUILD_DIR}/ && rm ${BUILD_DIR}/style.css

clean:
	rm -rf ${BUILD_DIR}
