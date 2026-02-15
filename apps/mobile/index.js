/**
 * Entry point. FormData polyfill MUST run before expo/react-native loads any module that uses it.
 * Hermes does not provide FormData; React Native's polyfill loads too late in monorepos.
 * Use setUpXHR (sets FormData global) instead of deprecated deep import.
 */
require('react-native/Libraries/Core/setUpXHR');

const { registerRootComponent } = require('expo');
const App = require('./App').default;
registerRootComponent(App);
