/**
 * Root entry for Expo when run from monorepo root.
 * Delegates to apps/mobile. Prefer running from apps/mobile: npm run dev:mobile
 */
require('formdata-polyfill');

const { registerRootComponent } = require('expo');
const App = require('./apps/mobile/App').default;
registerRootComponent(App);
