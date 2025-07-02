import WebFilter from '@APF/WebFilter';

const filter = new WebFilter();

if (
  typeof window !== 'undefined' &&
  ['[object Window]', '[object ContentScriptGlobalScope]'].includes({}.toString.call(window))
) {
  filter.initPageDetails();
  filter.cleanPage();
}
