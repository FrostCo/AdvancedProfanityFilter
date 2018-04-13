#!/bin/bash

branch_name=$(git symbolic-ref --short -q HEAD)

if [ "$(uname -s)" == "Darwin" ]; then
  # MacOS
  if [ $branch_name == "master" ]; then
    echo "extension-chrome.zip..."
    zip -vr "./extension-chrome.zip" ./ -i eventPage.js filter.js icons/\* manifest.json options.\* popup.\* -x .git
    # cp ./extension-{chrome.zip,opera.nex}
  elif [ $branch_name == "firefox" ]; then
    echo "extension-firefox.zip..."
    zip -vr "./extension-firefox.zip" ./ -i eventPage.js filter.js icons/\* manifest.json options.\* popup.\* -x .git
  fi
else
  # Linux
  if [ $branch_name == "master" ]; then
    echo "extension-chrome.zip..."
    7za u -tzip "./extension-chrome.zip" -aoa -ir\!eventPage.js filter.js icons/* manifest.json options.* popup.* -xr\!.git
    # cp ./extension-{chrome.zip,opera.nex}
  elif [ $branch_name == "firefox" ]; then
    echo "extension-firefox.zip..."
    7za u -tzip "./extension-firefox.zip" -aoa -ir\!eventPage.js filter.js icons/* manifest.json options.* popup.* -xr\!.git
  fi
fi
