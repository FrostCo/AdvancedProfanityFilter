#!/bin/bash

if [ "$(uname -s)" == "Darwin" ]; then
  # MacOS
  zip -vr "./extension.zip" ./ -i eventPage.js filter.js icons/\* manifest.json options.\* -x .git
else
  # Linux
  7za u -tzip ./extension.zip -aoa -ir\!eventPage.js filter.js icons/* manifest.json options.* -xr\!.git
fi
