/**
 * Links where we should always avoid performing a mercury load when clicked.
 * Includes links without href, hash links, external links, new tabs,
 * Javascript, and stuff like phone and email links.
 *
 * @type {Array}
 */
export const BASE_ON_CLICK_EXCEPTIONS = [
  'a:not([href])',
  '[href^="http"]',
  '[href^="#"]',
  '[href^="/#"]',
  '[target="_blank"]',
  '[href^="tel"]',
  '[href^="mailto"]',
  '[href^="javascript"]'
];