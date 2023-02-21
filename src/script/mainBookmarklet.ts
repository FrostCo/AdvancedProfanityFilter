import WebConfig from '@APF/webConfig';
import BookmarkletFilter from '@APF/bookmarkletFilter';

/* @preserve - Start User Config */
const config = WebConfig._defaults as WebConfig;
/* @preserve - End User Config */

console.log('[APF Bookmarklet] Bookmarklet activated');
if (typeof window !== 'undefined') {
  console.log('[APF Bookmarklet] Bookmarklet running');
  if (!config.words) config.words = WebConfig._defaultWords;
  const filter = new BookmarkletFilter;
  filter.initPageDetails();
  filter.cleanPage(config);
}
