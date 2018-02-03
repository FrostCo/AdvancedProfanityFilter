#!/bin/bash

branch_name=$(git symbolic-ref --short -q HEAD)

if [ "$(uname -s)" == "Darwin" ]; then
  # MacOS
  if [ $branch_name == "master" ]; then
    zip -vr "./extension-chrome.zip" ./ -i eventPage.js filter.js icons/\* manifest.json options.\* -x .git
    cp ./extension-{chrome.zip,opera.nex}
  elif [ $branch_name == "firefox" ]; then
    zip -vr "./extension-firefox.zip" ./ -i eventPage.js filter.js icons/\* manifest.json options.\* -x .git
  fi
else
  # Linux
  if [ $branch_name == "master" ]; then
    7za u -tzip "./extension-chrome.zip" -aoa -ir\!eventPage.js filter.js icons/* manifest.json options.* -xr\!.git
    cp ./extension-{chrome.zip,opera.nex}
  elif [ $branch_name == "firefox" ]; then
    7za u -tzip "./extension-firefox.zip" -aoa -ir\!eventPage.js filter.js icons/* manifest.json options.* -xr\!.git
  fi
fi
