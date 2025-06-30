/* eslint-disable no-console */
import Postbuild from '../lib/Postbuild.js';

export class PostbuildPlugin {
  apply(compiler) {
    compiler.hooks.done.tap('PostbuildPlugin', () => {
      const postbuild = new Postbuild();
      try {
        postbuild.run();
        console.log(postbuild.successMessage('postbuild'));
      } catch (error) {
        console.error(postbuild.errorMessage('postbuild'), error);
      }
    });
  }
}
