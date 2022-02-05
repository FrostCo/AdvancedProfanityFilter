import fse from 'fs-extra';
import Path from 'path';

fse.copyFileSync(Path.join('dist', 'bookmarkletFilter.js'), './bookmarklet.js');
