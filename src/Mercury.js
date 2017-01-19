import { replaceAttributes } from './utils';
import { BASE_ON_CLICK_EXCEPTIONS } from './constants';
import { isValidUpdateMatrix, validateOptionalParam, validateOnLoadDelay } from './validation';


/**
 * A configurable, asynchronous, plug-and-play loader for your website.
 * Intercepts clicks on <a> elements and performs an XHR to that href, and
 * updates the DOM according to a config object you pass in.
 *
 * @class Mercury
 */
class Mercury {

  /**
   * @constructor
   * @param {Object} config  The configuration object
   */
  constructor(config) {
    if (!window.history || !window.history.pushState || !document.querySelector) {
      console.error('Your browser does not support Mercury.');
      return;
    }

    if (!this.validateAndAssignConfig(config)) {
      return;
    }

    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    if (this.enableCache) {
      this.cache = {};
    }

    this.loadEvent = new CustomEvent('mercury:load');
    this.unloadEvent = new CustomEvent('mercury:unload');

    this.boundOnClick = this.onClick.bind(this);
    this.boundOnPopState = this.onPopState.bind(this);

    this.bindListeners();
  }

  /**
   * Given a config object fed into the constructor, validate each of the
   * possible config params, and assign them to the class as properties where
   * appropriate.
   *
   * @param {Array}     config.updateMatrix           Array of selectors to update
   * @param {Boolean}   [config.enableCache]          Save markup in a cache object
   * @param {Array}     [config.onClickExceptions]    Array of selectors to exclude from AJAX requests
   * @param {Array}     [config.onRequestExceptions]  Array of selectors to exclude from AJAX requests
   * @param {Function}  [config.onLoad]               Function to run after the AJAX request
   * @param {Function}  [config.onUnload]             Function to run before the AJAX request
   * @param {Number}    [config.timeout]              Timeout in milliseconds for AJAX request
   * @param {Number}    [config.onLoadDelay]          Delay time in milliseconds for a setTimeout to config.onLoad
   * @return {Boolean}                                Whether validation passed
   */
  validateAndAssignConfig({
    updateMatrix,
    onClickExceptions = [],
    onRequestExceptions = [],
    enableCache,
    timeout,
    onLoad,
    onUnload,
    onNavigate,
    onLoadDelay
  }) {
    if (!isValidUpdateMatrix(updateMatrix)) {
      return false;
    }
    this.updateMatrix = updateMatrix;

    this.timeout = validateOptionalParam(timeout, 'number', 5000);
    this.enableCache = validateOptionalParam(enableCache, 'boolean', false);
    this.onLoad = validateOptionalParam(onLoad, 'function', () => {});
    this.onUnload = validateOptionalParam(onUnload, 'function', () => {});
    this.onNavigate = validateOptionalParam(onNavigate, 'function', () => {});
    this.onLoadDelay = validateOnLoadDelay(onLoadDelay);

    if (Array.isArray(onClickExceptions)) {
      this.onClickExceptionSelector = BASE_ON_CLICK_EXCEPTIONS.concat(onClickExceptions).join(',');
    } else {
      this.onClickExceptionSelector = BASE_ON_CLICK_EXCEPTIONS.join(',');
    }

    if (Array.isArray(onRequestExceptions) && onRequestExceptions.length) {
      this.onRequestExceptionRegex = new RegExp(onRequestExceptions.join('|'), 'gi');
    }

    return true;
  }

  /**
   * To be run before an ajax request is made. Replaces the current history
   * state with a new one containing the correct scroll values to restore on
   * popstate.
   *
   * @private
   */
  replaceHistoryStateWithScrollPosition() {
    const url = window.location.pathname + window.location.search;
    const stateObject = {
      url,
      scroll: {
        x: window.pageXOffset,
        y: window.pageYOffset
      }
    };
    window.history.replaceState(stateObject, document.title, url);
  }

  /**
   * To be run after the request receives responseText. Takes the responseText,
   * parses it, loops through updateMatrix and updates the appropriate attrs or
   * innerHTML. Also checks the cache to see if there is any cached HTML, and
   * uses that instead if so.
   *
   * @private
   * @param  {String} url           URL that the new DOM is from
   * @param  {String} responseText  Response text from request (the HTML)
   */
  updateDOM(url, responseText) {
    const parser = new DOMParser();
    const newDoc = parser.parseFromString(responseText, 'text/html');

    this.updateMatrix.forEach((updateConfig) => {
      const activeElement = document.querySelector(updateConfig.selector);
      const referenceElement = newDoc.querySelector(updateConfig.selector);
      if (activeElement && referenceElement) {
        if (updateConfig.updateHTML) {
          const hasCached = this.enableCache && this.cache[url] && this.cache[url][updateConfig.selector];
          const newHTML = hasCached ? this.cache[url][updateConfig.selector] : referenceElement.innerHTML;
          activeElement.innerHTML = newHTML;
        }
        if (updateConfig.updateAttrs) {
          replaceAttributes(activeElement, referenceElement);
        }
      } else if (activeElement) {
        activeElement.parentNode.removeChild(activeElement);
      }
    });
    window.scrollTo(0, 0);
  }

  /**
   * Handle all the logic behind making the request, including running
   * beforeRequest, binding the onreadystatechange handler and making the actual
   * request, handling 401, 403, matches to the exception Regex, timeout, and
   * error, running modifyPageAndHistory, etc.
   *
   * Note: isPopState indicates whether a new history state should be
   * created for this particular run of makeRequest (we don't need one when this
   * is triggered by a popstate).
   *
   * @private
   * @param  {String}    url               URL at which to make the request
   * @param  {Boolean}   isPopState        Whether or not the event is a popstate
   * @param  {Function}  callback          Callback to call after request is done
   */
  makeRequest(url, isPopState, callback) {
    if (this.onNavigate) {
      this.onNavigate();
    }
    this.replaceHistoryStateWithScrollPosition();

    this.XHR = new XMLHttpRequest();
    this.XHR.onreadystatechange = (e) => {
      if (e.target.readyState !== XMLHttpRequest.DONE) {
        return;
      }
      if (e.target.status !== 200) {
        window.location = url;
        return;
      }
      try {
        const isRegExp = this.onRequestExceptionRegex && this.onRequestExceptionRegex.constructor === RegExp;
        const doesNotMatchExceptions = e.target.responseText.match(this.onRequestExceptionRegex) !== null;
        if (isRegExp && doesNotMatchExceptions) {
          window.location = url;
          return;
        }
        window.dispatchEvent(this.unloadEvent);
        if (this.onLoadDelay) {
          this.onLoadDelayTimeout = window.setTimeout(() => {
            this.modifyPageAndHistory(url, isPopState, callback, e.target.responseText);
          }, this.onLoadDelay);
        } else {
          this.modifyPageAndHistory(url, isPopState, callback, e.target.responseText);
        }
      } catch (error) {
        console.error(error);
      }
    };

    // Handle XHR timeout (i.e. the request takes too long to complete)
    this.XHR.ontimeout = () => {
      window.location = url;
    };

    // Handle error state (i.e. internet disconnected)
    this.XHR.onerror = () => {
      window.location = url;
    };

    this.XHR.open('GET', url, true);
    this.XHR.timeout = this.timeout;
    this.XHR.send();
  }

  /**
   * A helper function to makeRequest that inherits the same parameters in addition
   * to the XHR event
   * This function updates the history state, calls the callback passed to makeRequest,
   * and fires the loadEvent
   *
   * Note: isPopState indicates whether a new history state should be
   * created for this particular run of makeRequest (we don't need one when this
   * is triggered by a popstate).
   *
   * @private
   * @param  {String}    url               URL at which to make the request
   * @param  {Boolean}   isPopState        Whether or not the event is a popstate
   * @param  {Function}  callback          Callback to call after request is done
   * @param  {Object}    responseText      responseText from the XHR
   */
  modifyPageAndHistory(url, isPopState, callback, responseText) {
    if (!isPopState) {
      const stateObject = { url };
      window.history.pushState(stateObject, document.title, url);
    }
    this.updateDOM(url, responseText);
    if (callback) {
      callback();
    }
    window.dispatchEvent(this.loadEvent);
  }

  /**
   * Given a click event, checks whether one of the modifier keys is pressed.
   *
   * @private
   * @param  {Object}  e   eventObject from click
   * @return {Boolean}     Whether one of the modifier keys is pressed
   */
  isKeyModified(e) {
    return e.metaKey || e.ctrlKey || e.altKey || e.shiftKey;
  }

  /**
   * Global click handler, to be bound to body. When any click occurs, walk up
   * the DOM to check if it occurs on an A element or one of its parents is an
   * A element. If so, make the mercury request rather than executing default
   * behavior, unless the element also matches the onClickExceptionSelector.
   *
   * @private
   * @param  {Object} e   Event object from click event
   */
  onClick(e) {
    if (this.isKeyModified(e)) {
      return;
    }
    let target = e.target;
    while (target && target !== document.body && target.tagName.toUpperCase() !== 'A') {
      target = target.parentElement;
    }
    if (!target || target === document.body || target.matches(this.onClickExceptionSelector)) {
      return;
    }
    e.preventDefault();
    if (this.XHR) {
      this.XHR.abort();
      window.clearTimeout(this.onLoadDelayTimeout);
    }
    this.makeRequest(target.getAttribute('href'), false, null);
  }

  /**
   * Global popstate handler, to handle popstate (typically occuring when the
   * user clicks the back or forward buttons in the browser). Make the proper
   * request, but also scroll to position stored in the state.
   *
   * @private
   * @param  {Object} e   Event object from popstate
   */
  onPopState(e) {
    if (!e.state) { return; }
    const callback = () => {
      if (e.state.scroll) {
        window.scrollTo(e.state.scroll.x, e.state.scroll.y);
      } else {
        window.scrollTo(0, 0);
      }
    };
    if (this.XHR) {
      this.XHR.abort();
      window.clearTimeout(this.onLoadDelayTimeout);
    }
    this.makeRequest(e.state.url, true, callback);
  }

  /**
   * Public method for the user of this class to pass in some HTML to commit to
   * the class's cache. When the updateDOM call occurs, the method will check
   * the cache first to see if there's a match for that URL with that selector,
   * and use the cached HTML if there is.
   *
   * The primary use case for this method is situations where other content is
   * loaded asynchronously, and the user wishes for Mercury to use that content
   * rather than whatever is on the server. Consider – infinite scrolling blogs
   * may call commitCacheEntry each time a new load occurs.
   *
   * @public
   * @param  {String} url       URL of cache entry
   * @param  {String} selector  Selector of node containing cached HTML
   */
  commitCacheEntry(url, selector) {
    if (!this.enableCache || !url || !selector) {
      return;
    }
    this.cache[url] = this.cache[url] || {};
    this.cache[url][selector] = document.querySelector(selector).innerHTML;
  }

  /**
   * Bind all event listeners, including click, popstate, load, and unload.
   * Not a public method – called in the constructor.
   *
   * @private
   */
  bindListeners() {
    document.body.addEventListener('click', this.boundOnClick);
    window.addEventListener('popstate', this.boundOnPopState);
    window.addEventListener(this.loadEvent.type, this.onLoad);
    window.addEventListener(this.unloadEvent.type, this.onUnload);
  }

  /**
   * Clear timeout and unbind all event listeners, including click, popstate, load, and unload.
   *
   * @public
   */
  destroy() {
    if (this.XHR) {
      this.XHR.abort();
    }
    window.clearTimeout(this.onLoadDelayTimeout);
    document.body.removeEventListener('click', this.boundOnClick);
    window.removeEventListener('popstate', this.boundOnPopState);
    window.removeEventListener(this.loadEvent.type, this.onLoad);
    window.removeEventListener(this.unloadEvent.type, this.onUnload);
  }

}



export default Mercury;
