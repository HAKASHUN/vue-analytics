/*!
 * vue-analytics v4.1.3
 * (c) 2017 Matteo Gabriele
 * Released under the MIT License.
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('load-script')) :
  typeof define === 'function' && define.amd ? define(['load-script'], factory) :
  (global.VueAnalytics = factory(global.loadScript));
}(this, (function (loadScript) { 'use strict';

loadScript = 'default' in loadScript ? loadScript['default'] : loadScript;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};

/**
 * Whining helper
 * @param  {String} message
 */
var warn = function warn() {
  for (var _len = arguments.length, message = Array(_len), _key = 0; _key < _len; _key++) {
    message[_key] = arguments[_key];
  }

  /* eslint-disable */
  console.warn('[VueAnalytics] ' + message.join(' '));
  /* eslint-enable */
};

/**
 * Returns if a string exists in the array of routes
 * @param  {String} name
 * @return {Boolean}
 */
var exists = function exists(name) {
  return !!(config.ignoreRoutes.length && config.ignoreRoutes.indexOf(name) !== -1);
};

/**
 * Merges two objects
 * @param  {Object} obj
 * @param  {Object} src
 * @return {Object}
 */
var merge = function merge(obj, src) {
  Object.keys(src).forEach(function (key) {
    if (obj[key] && _typeof(obj[key]) === 'object') {
      merge(obj[key], src[key]);
      return;
    }

    obj[key] = src[key];
  });

  return obj;
};

function getName(value) {
  return value.replace(/-/gi, '');
}

function getListId() {
  return [].concat(config.id);
}

function generateMethodName(method, id) {
  var domain = getName(id);
  return getListId().length > 1 ? domain + '.' + method : method;
}

/**
 * Default configuration
 */
var config = {
  debug: {
    enabled: false,
    trace: false,
    sendHitTask: true
  },
  autoTracking: {
    exception: false,
    page: true,
    pageviewOnLoad: true,
    pageviewTemplate: null
  },
  id: null,
  userId: null,
  ignoreRoutes: []

  /**
   * Returns the new configuation object
   * @param  {Object} params
   * @return {Object}
   */
};function updateConfig(params) {
  return merge(config, params);
}

function ga(method) {
  for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }

  if (typeof window.ga === 'undefined') {
    return;
  }

  getListId().forEach(function (id) {
    var _window;

    (_window = window).ga.apply(_window, [generateMethodName(method, id)].concat(args));
  });
}

/**
 * Returns a querystring from an object
 * @param  {Object} query
 * @return {String}
 */
function getQueryString(query) {
  var queryString = Object.keys(query).reduce(function (queryString, param, index, collection) {
    queryString += param + '=' + query[param];

    if (index < collection.length - 1) {
      queryString += '&';
    }

    return queryString;
  }, '?');

  return queryString === '?' ? '' : queryString;
}

/**
 * Returns pageview data from VueRouter instance
 * @param  {VueRouter} router
 * @param  {any} args
 * @return {Object}
 */
function getDataFromRouter(router, args) {
  if (!router) {
    warn('Is not possible to track the current route without VueRouter installed');
    return;
  }

  var route = router.currentRoute;

  var params = {
    page: route.path + getQueryString(route.query),
    title: route.name,
    location: window.location.href
  };

  if (typeof args[1] === 'function') {
    params.hitCallback = args[1];
  }

  return params;
}

/**
 * Page tracking
 * @param  {any} args
 */
function page() {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  var value = args[0];

  if (value.constructor.name === 'VueRouter') {
    ga('send', 'pageview', getDataFromRouter(value, args));
    return;
  }

  ga.apply(undefined, ['send', 'pageview'].concat(args));
}

/**
 * Updating tracker data
 * @param {any} data
 */
function set$1() {
  if (typeof window.ga === 'undefined') {
    return;
  }

  for (var _len = arguments.length, data = Array(_len), _key = 0; _key < _len; _key++) {
    data[_key] = arguments[_key];
  }

  if (!data.length) {
    return;
  }

  if (_typeof(data[0]) === 'object' && data[0].constructor === Object) {
    // Use the ga.set with an object literal
    ga('set', data[0]);
    return;
  }

  if (data.length < 2 || typeof data[0] !== 'string' && typeof data[1] !== 'string') {
    warn('$ga.set needs a field name and a field value, or you can pass an object literal');
    return;
  }

  // Use ga.set with field name and field value
  ga('set', data[0], data[1]);
}

function trackRoute(proxy, router) {
  var currentRoute = router.currentRoute;

  var template = proxy ? proxy(router.currentRoute) : router;

  if (exists(currentRoute.name)) {
    return;
  }

  set$1('page', currentRoute.path);
  page(template, router);
}

/**
 * Enable route autoTracking page
 * @param  {VueRouter} router
 */
function autoTrackPage(router) {
  if (!config.autoTracking.page || !router) {
    return;
  }

  var pageviewProxyFn = config.autoTracking.pageviewTemplate;

  if (config.autoTracking.pageviewOnLoad) {
    trackRoute(pageviewProxyFn, router);
  }

  // Track all other pages
  router.afterEach(function () {
    setTimeout(function () {
      // https://github.com/MatteoGabriele/vue-analytics/issues/44
      trackRoute(pageviewProxyFn, router);
    }, 0);
  });
}

/**
 * Exception Tracking
 * @param  {Error}  error
 * @param  {Boolean} [fatal=false]
 */
function exception(error) {
  var fatal = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

  ga('send', 'exception', {
    exDescription: error,
    exFatal: fatal
  });
}

function autoTrackException() {
  if (!config.autoTracking.exception) {
    return;
  }

  // start auto tracking error exceptions
  window.onerror = function (error) {
    return exception(error.message || error);
  };
}

/**
 * Event tracking
 * @param  {any} args
 */
function event() {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  ga.apply(undefined, ['send', 'event'].concat(args));
}

/**
 * Time tracking
 * @param  {any} args
 */
function time() {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  ga.apply(undefined, ['send', 'timing'].concat(args));
}

/**
 * Plain access to the GA
 * with the query method is possible to pass everything.
 * if there's some new command that is not implemented yet, just use this
 * @param  {any} args
 */
function query() {
  ga.apply(undefined, arguments);
}

/**
 * Social interactions
 * @param  {any} args
 */
function social() {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  ga.apply(undefined, ['send', 'social'].concat(args));
}

/**
 * Use Google Analytics require key
 * @param  {any} value
 */
function gaRequire(value) {
  ga('require', value);
}

var features = {
  autoTrackPage: autoTrackPage,
  autoTrackException: autoTrackException,
  social: social,
  page: page,
  event: event,
  time: time,
  exception: exception,
  set: set$1,
  query: query,

  // require is already a used keyword in javascript
  // need to pass it in a different way or could export
  // the wrong function
  require: gaRequire
};

function init(router, callback) {
  if (config.manual) {
    return;
  }

  if (!config.id || !config.id.length) {
    var url = 'https://github.com/MatteoGabriele/vue-analytics#usage';
    warn('Please enter a Google Analaytics tracking ID', url);
    return;
  }

  var options = config.userId ? { userId: config.userId } : {};
  var debugSource = config.debug.enabled ? '_debug' : '';
  var source = 'https://www.google-analytics.com/analytics' + debugSource + '.js';

  loadScript(source, function (error, script) {
    if (error) {
      warn('Ops! Is not possible to load Google Analytics script');
      return;
    }

    var poll = setInterval(function () {
      if (!window.ga) {
        return;
      }

      clearInterval(poll);

      if (config.debug.enabled) {
        window.ga_debug = {
          trace: config.debug.trace
        };
      }

      var ids = getListId();
      var autoLink = config.autoLink || [];

      ids.forEach(function (id) {
        if (ids.length > 1) {
          // we need to register the name used by the ga methods so that
          // when a method is used Google knows which account did it
          options['name'] = getName(id);
        }
        if (autoLink.length > 0) {
          options['allowLinker'] = true;
        }

        window.ga('create', id, 'auto', options);
        if (autoLink.length > 0) {
          window.ga('require', 'linker');
          window.ga('linker:autoLink', autoLink);
        }
      });

      // the callback is fired when window.ga is available and before any other hit is sent
      // see MatteoGabriele/vue-analytics/issues/20
      if (callback && typeof callback === 'function') {
        callback();
      }

      if (!config.debug.sendHitTask) {
        features.set('sendHitTask', null);
      }

      features.autoTrackException();
      features.autoTrackPage(router);
    }, 10);
  });
}

/**
 * Vue installer
 * @param  {Vue instance} Vue
 * @param  {Object} [options={}]
 */
function install(Vue) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var router = options.router;


  delete options.router;
  updateConfig(options);

  init(router, options.onReady);

  Vue.prototype.$ga = Vue.$ga = features;
}

var index = { install: install, generateMethodName: generateMethodName };

return index;

})));
