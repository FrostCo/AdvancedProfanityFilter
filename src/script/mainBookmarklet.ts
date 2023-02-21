import WebConfig from '@APF/webConfig';
import BookmarkletFilter from '@APF/bookmarkletFilter';

/* @preserve - Start User Config */
const config = WebConfig._defaults as WebConfig;
/* @preserve - End User Config */

if (typeof window !== 'undefined') {
  if (!config.words) config.words = WebConfig._defaultWords;
  const filter = new BookmarkletFilter;
  filter.initPageDetails();
  filter.cleanPage(config);
}
