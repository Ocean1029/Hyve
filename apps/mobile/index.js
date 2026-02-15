/**
 * Entry point. FormData polyfill MUST run before expo/react-native loads any module that uses it.
 * Hermes does not provide FormData; React Native's polyfill loads too late in monorepos.
 */
const RNFormData = require('react-native/Libraries/Network/FormData');
global.FormData = RNFormData;

const { registerRootComponent } = require('expo');
const App = require('./App').default;
registerRootComponent(App);
