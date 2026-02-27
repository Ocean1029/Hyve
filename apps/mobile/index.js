/**
 * Entry point. FormData polyfill MUST run before expo/react-native loads any module that uses it.
 * Hermes does not provide FormData; React Native's setUpXHR deep import is deprecated.
 * formdata-polyfill sets global FormData and patches fetch to handle it.
 */
require('formdata-polyfill');

const { registerRootComponent } = require('expo');
const App = require('./App').default;
registerRootComponent(App);
