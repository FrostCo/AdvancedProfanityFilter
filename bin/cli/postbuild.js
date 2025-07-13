/* eslint-disable no-console */
import Postbuild from '../lib/Postbuild.js';

const postbuild = new Postbuild();
try {
  postbuild.run();
  console.log(postbuild.successMessage('postbuild'));
  console.log(postbuild.actionsTaken);
  if (postbuild.actionsTaken.length > 0) {
    console.log(` 🪛 Actions taken: ${postbuild.actionsTaken.join(', ')}\n`);
  }
} catch (error) {
  console.error(postbuild.errorMessage('postbuild'), error);
}
