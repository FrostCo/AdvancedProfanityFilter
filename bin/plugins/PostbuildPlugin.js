/* eslint-disable no-console */
import Postbuild from '../lib/Postbuild.js';

export class PostbuildPlugin {
  apply(compiler) {
    compiler.hooks.done.tap('PostbuildPlugin', (stats) => {
      const postbuild = new Postbuild();
      try {
        postbuild.run();
        console.log(postbuild.successMessage('postbuild'));
        const actionsTakenMessage = postbuild.actionsTakenMessage();
        if (actionsTakenMessage) {
          console.log(actionsTakenMessage);
        }
      } catch (error) {
        console.error(postbuild.errorMessage('postbuild'), error);
        // Add the error to webpack's compilation errors
        stats.compilation.errors.push(error);
      }
    });
  }
}
