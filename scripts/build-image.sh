#!/bin/bash

# Base image
NODEJS_BASE_IMAGE=$(cat .s2ibase)

# Checks whether the important programs are installed
if ! command -v podman &> /dev/null; then
  echo "This script requires podman to be installed."
  exit 1
fi
if ! command -v s2i &> /dev/null; then
  echo "This script requires s2i to be installed."
  exit 1
fi
# Creates temporary folder for the build
tmp_dir=$(mktemp -d -t peribolos-XXXXXXXXXX)

s2i build . ${NODEJS_BASE_IMAGE} --as-dockerfile ${tmp_dir}/Containerfile
cd $tmp_dir
podman build -t peribolos-as-a-service .

# Cleaning after the build
rm -rf $tmp_dir
