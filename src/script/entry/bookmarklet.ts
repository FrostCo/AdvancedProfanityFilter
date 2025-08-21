/* eslint-disable no-console */
import WebConfig from '@APF/WebConfig';
import BookmarkletFilter from '@APF/BookmarkletFilter';

/* @preserve - Advanced Profanity Filter by Richard Frost (FrostCo) */
/* @preserve - Start User Config */
const config = WebConfig._defaults as WebConfig;
/* @preserve - End User Config */

console.log(`[APF Bookmarklet] Activated (version ${WebConfig.Environment.version})`);
if (typeof window !== 'undefined' && !(<any>window).apfBookmarklet) {
  (<any>window).apfBookmarklet = true;
  console.log('[APF Bookmarklet] Running');
  if (!config.words) config.words = WebConfig._defaultWords;
  const filter = new BookmarkletFilter();
  filter.initPageDetails();
  filter.cleanPage(config);
}
