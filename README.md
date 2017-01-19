Squarespace Mercury
------------------------------

A configurable, asynchronous, plug-and-play loader for your website. Intercepts clicks on `<a>` elements and performs an XHR to that href, and updates the DOM according to a config object you pass in.

*NOTICE: This code is licensed to you pursuant to Squarespace’s Developer Terms of Use. See license section below.*

## Usage

```sh
npm install --save @squarespace/mercury;
```

```js
const Mercury = require('@squarespace/mercury');

const instance = new Mercury({
  updateMatrix: [
    { selector: 'title', updateHTML: true },
    { selector: 'body', updateAttrs: true },
    { selector: '.content', updateHTML: true }
  ]
});
```

### Using ES6

If you prefer to handle transpiling and polyfilling on your own, you can import ES6 from Mercury:

```js
import Mercury from '@squarespace/mercury/src';
```

Alternately, Mercury specifies a `module` property in `package.json` that points to the uncompiled `src/index.js`, so you may be able to simply import `@squarespace/mercury` if you're using one of the following bundlers:
* [Webpack 2](https://webpack.js.org/configuration/resolve/#resolve-mainfields)
* [Rollup](https://github.com/rollup/rollup-plugin-node-resolve#rollup-plugin-node-resolve)

## Reference

### new Mercury(config)
**Params**
* config `Object` - Config object
* config.updateMatrix `Array` - Array of selectors to update (required)
* [config.enableCache] `Boolean` - Save markup in a cache object
* [config.onClickExceptions] `Array` - Array of selectors to exclude from AJAX requests
* [config.onRequestExceptions] `Array` - Array of selectors to exclude from AJAX requests
* [config.onLoad] `Function` - Function to run after the AJAX request
* [config.onUnload] `Function` - Function to run before the AJAX request
* [config.timeout] `Number` - Timeout in milliseconds for AJAX request

### Mercury.destroy()
Unbind all event listeners, including click, popstate, load, and unload.

### Mercury.commitCacheEntry(url, selector)
Public method for the user of this class to pass in some HTML to commit to the class's cache. When the updateDOM call occurs, the method will check the cache first to see if there's a match for that URL with that selector, and use the cached HTML if there is.

The primary use case for this method is situations where other content is loaded asynchronously, and the user wishes for Mercury to use that content rather than whatever is on the server. Consider – infinite scrolling blogs may call commitCacheEntry each time a new load occurs.

**Params**
* url `String` - Current URL for committed cache entry
* selector `String` - Current selector for committed cache entry

## License
Portions Copyright © 2016 Squarespace, Inc. This code is licensed to you pursuant to Squarespace’s Developer Terms of Use, available at http://developers.squarespace.com/developer-terms-of-use (the “Developer Terms”). You may only use this code on websites hosted by Squarespace, and in compliance with the Developer Terms. TO THE FULLEST EXTENT PERMITTED BY LAW, SQUARESPACE PROVIDES ITS CODE TO YOU ON AN “AS IS” BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.