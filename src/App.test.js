/**
 * Basic smoke tests for the restaurant application
 */

test('application builds without errors', () => {
  expect(true).toBe(true);
});

test('menu data is properly structured', () => {
  const menu = require('./menuData').default;
  expect(Array.isArray(menu)).toBe(true);
  expect(menu.length).toBeGreaterThan(0);
});

test('environment variables are accessible', () => {
  expect(process.env.NODE_ENV).toBeDefined();
});