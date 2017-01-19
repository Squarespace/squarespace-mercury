/**
 * Given an update matrix (array of update configs for Mercury constructor),
 * loop through and figure out whether the matrix is valid or not.
 *
 * @param  {Array} matrix   Update matrix
 * @return {Boolean}        Whether the matrix is valid
 */
export const isValidUpdateMatrix = (matrix) => {
  if (!Array.isArray(matrix)) {
    console.error('updateMatrix is not an Array');
    return false;
  }
  return matrix.every((updateConfig) => {
    const { selector, updateHTML, updateAttrs } = updateConfig;
    if (typeof selector !== 'string') {
      console.error(`${selector} is not a valid selector.`);
      return false;
    }
    const nonBooleanUpdateHTML = typeof updateHTML !== 'undefined' && typeof updateHTML !== 'boolean';
    const nonBooleanUpdateAttrs = typeof updateAttrs !== 'undefined' && typeof updateAttrs !== 'boolean';
    if (nonBooleanUpdateHTML || nonBooleanUpdateAttrs) {
      console.error(`Non-boolean updateHTML or updateAttrs provided for selector ${selector}.`);
      return false;
    }
    return true;
  });
};

/**
 * Given an optional param, validate it against a type (using typeof), return
 * the fallback if param is invalid or not provided, and return the param if
 * it's valid.
 *
 * @param  {*}      param     Param to validate
 * @param  {String} type      Expected type of param
 * @param  {*}      fallback  Param to fall back to if param is invalid
 * @return {*}                Param or fallback
 */
export const validateOptionalParam = (param, type, fallback) => {
  if (param === undefined) {
    return fallback;
  }
  if (typeof param !== type) {
    console.error(`${param} is not a ${type}.`);
    return fallback;
  }
  return param;
};

/**
 * Given a delayTime, validate it against a number type (using typeof),
 * return 0 if delayTime is invalid or not provided, and return the delayTime
 * if it's valid.
 *
 * @param  {Number}   delayTime   delayTime to validate
 * @return {Number}               0 or delayTime
 */
export const validateOnLoadDelay = (delayTime) => {
  if (delayTime === undefined) {
    return 0;
  }
  if (typeof delayTime !== 'number') {
    console.error(`${delayTime} is not a number.`);
    return 0;
  }
  if (delayTime < 0) {
    console.error(`${delayTime} is less than 0.`);
    return 0;
  }
  return delayTime;
};
