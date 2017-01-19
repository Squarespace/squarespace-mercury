/**
 * Given an element and a new reference element, set the attributes on the old
 * element to match those of the reference element.
 * @param  {HTMLElement} element
 * @param  {HTMLElement} referenceElement
 */
export const replaceAttributes = (element, referenceElement) => {
  const elementAttributes = Array.from(element.attributes);
  for (let i = 0; i < elementAttributes.length; i++) {
    element.removeAttribute(elementAttributes[i].name);
  }
  for (let i = 0; i < referenceElement.attributes.length; i++) {
    element.setAttribute(referenceElement.attributes[i].name, referenceElement.attributes[i].value);
  }
};
