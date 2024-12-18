.DEFAULT_GOAL := build
.PHONY: build install

build:
	bun build bin/clara.ts --compile --outfile bin/clara

install: build
	sudo mv bin/clara /usr/local/bin/
	@echo "Clara installed successfully to /usr/local/bin/"