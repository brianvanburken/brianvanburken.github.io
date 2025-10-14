BUILD_DIR=public

.PHONEY: default build

default: clean
	zola serve

build: clean
	zola build

clean: 
	rm -rf ${BUILD_DIR}
