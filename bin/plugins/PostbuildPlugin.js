import Postbuild from '../lib/Postbuild.js';

export class PostbuildPlugin {
  apply(compiler) {
    compiler.hooks.done.tap('PostbuildPlugin', () => {
      const postbuild = new Postbuild();
      postbuild.run();
      // eslint-disable-next-line no-console
      console.log('[Postbuild] ✅ Postbuild process complete!');
    });
  }
}
