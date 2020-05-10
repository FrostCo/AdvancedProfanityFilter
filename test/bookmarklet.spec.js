const expect = require('chai').expect;
import Bookmarklet from './built/bookmarklet';

describe('Bookmarklet', function() {
  describe('dropboxDownloadURL()', function() {
    it('should translate url', function() {
      let url = 'https://www.dropbox.com/s/uh32s8hiuj4bdz4/apfBookmarklet.js?dl=0';
      expect(Bookmarklet.dropboxDownloadURL(url)).to.eq('https://dl.dropbox.com/s/uh32s8hiuj4bdz4/apfBookmarklet.js?raw=1');
    });

    it('should not translate other urls', function() {
      let url = 'https://raw.githubusercontent.com/user/project/branch/apfBookmarklet.js';
      expect(Bookmarklet.dropboxDownloadURL(url)).to.eq(url);
    });
  });

  describe('githubDownloadURL()', function() {
    it('should translate url', function() {
      let url = 'https://raw.githubusercontent.com/user/project/branch/apfBookmarklet.js';
      expect(Bookmarklet.githubDownloadURL(url)).to.eq('https://cdn.jsdelivr.net/gh/user/project@branch/apfBookmarklet.js');
    });

    it('should translate url with different filename', function() {
      let url = 'https://raw.githubusercontent.com/user/project/branch/filter.js';
      expect(Bookmarklet.githubDownloadURL(url)).to.eq('https://cdn.jsdelivr.net/gh/user/project@branch/filter.js');
    });

    it('should not translate other urls', function() {
      let url = 'https://www.dropbox.com/s/uh32s8hiuj4bdz4/apfBookmarklet.js?dl=0';
      expect(Bookmarklet.githubDownloadURL(url)).to.eq(url);
    });
  });

  describe('gitHubGistDownloadURL()', function() {
    it('should translate url', function() {
      let url = 'https://gist.githubusercontent.com/user/gist_id/raw/revision_id/apfBookmarklet.js';
      expect(Bookmarklet.gitHubGistDownloadURL(url)).to.eq('https://cdn.statically.io/gist/user/gist_id/raw/apfBookmarklet.js?env=dev');
    });

    it('should translate with different filename', function() {
      let url = 'https://gist.githubusercontent.com/user/gist_id/raw/revision_id/filter.js';
      expect(Bookmarklet.gitHubGistDownloadURL(url)).to.eq('https://cdn.statically.io/gist/user/gist_id/raw/filter.js?env=dev');
    });

    it('should translate gist link using default name', function() {
      let url = 'https://gist.github.com/user/gist_id';
      expect(Bookmarklet.gitHubGistDownloadURL(url)).to.eq(`https://cdn.statically.io/gist/user/gist_id/raw/${Bookmarklet._defaultFilename}?env=dev`);
    });

    it('should not translate other urls', function() {
      let url = 'https://www.dropbox.com/s/uh32s8hiuj4bdz4/apfBookmarklet.js?dl=0';
      expect(Bookmarklet.gitHubGistDownloadURL(url)).to.eq(url);
    });
  });

  describe('googleDriveDownloadURL()', function() {
    it('should translate url', function() {
      let url = 'https://drive.google.com/file/e/17I2zgcq8Qpt4VVdYiVk/view?usp=sharing';
      expect(Bookmarklet.googleDriveDownloadURL(url)).to.eq('https://drive.google.com/uc?export=view&id=17I2zgcq8Qpt4VVdYiVk');
    });

    it('should not translate other urls', function() {
      let url = 'https://www.dropbox.com/s/uh32s8hiuj4bdz4/apfBookmarklet.js?dl=0';
      expect(Bookmarklet.googleDriveDownloadURL(url)).to.eq(url);
    });
  });
});
