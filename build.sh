#!/bin/bash

branch_name=$(git symbolic-ref --short -q HEAD)

# if [ "$(uname -s)" == "Darwin" ]; then
#   # MacOS
#   if [ $branch_name == "master" ]; then
#     echo "extension-chrome.zip..."
#     zip -vr "./extension-chrome.zip" ./ -i eventPage.js filter.js icons/\* manifest.json options.\* popup.\* -x .git
#     # cp ./extension-{chrome.zip,opera.nex}
#   elif [ $branch_name == "firefox" ]; then
#     echo "extension-firefox.zip..."
#     zip -vr "./extension-firefox.zip" ./ -i eventPage.js filter.js icons/\* manifest.json options.\* popup.\* -x .git
#   fi
# else
#   # Linux
#   if [ $branch_name == "master" ]; then
#     echo "extension-chrome.zip..."
#     7za u -tzip "./extension-chrome.zip" -aoa -ir\!eventPage.js filter.js icons/* manifest.json options.* popup.* -xr\!.git
#     # cp ./extension-{chrome.zip,opera.nex}
#   elif [ $branch_name == "firefox" ]; then
#     echo "extension-firefox.zip..."
#     7za u -tzip "./extension-firefox.zip" -aoa -ir\!eventPage.js filter.js icons/* manifest.json options.* popup.* -xr\!.git
#   fi
# fi

tsc --outfile ./dist/eventPage.js ./src/helper.ts ./src/config.ts ./src/eventPage.ts --target es6
tsc --outfile ./dist/filter.js ./src/helper.ts ./src/config.ts ./src/word.ts ./src/page.ts ./src/filter.ts --target es6
tsc --outfile ./dist/optionPage.js ./src/helper.ts ./src/config.ts ./src/optionAuth.ts ./src/optionTab.ts ./src/optionPage.ts --target es6
tsc --outfile ./dist/popup.js ./src/helper.ts ./src/config.ts ./src/domain.ts ./src/popup.ts --target es6
