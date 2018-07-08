#!/bin/bash

tsc --outfile ./dist/eventPage.js ./src/helper.ts ./src/config.ts ./src/eventPage.ts --target es6
tsc --outfile ./dist/filter.js ./src/helper.ts ./src/config.ts ./src/word.ts ./src/page.ts ./src/filter.ts --target es6
tsc --outfile ./dist/optionPage.js ./src/helper.ts ./src/config.ts ./src/optionAuth.ts ./src/optionTab.ts ./src/optionPage.ts --target es6
tsc --outfile ./dist/popup.js ./src/helper.ts ./src/config.ts ./src/domain.ts ./src/popup.ts --target es6