import WebConfig from '@APF/webConfig';
import BookmarkletFilter from '@APF/bookmarkletFilter';

/* @preserve - Start User Config */
const config = WebConfig._defaults as any;
/* @preserve - End User Config */

if (typeof window !== 'undefined') {
  const filter = new BookmarkletFilter;
  filter.initPageDetails();
  filter.cleanPage(config);
}
