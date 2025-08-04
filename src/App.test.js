import { render } from '@testing-library/react';

// Simple smoke test - just ensure critical modules can be imported
test('application modules load without errors', () => {
  expect(() => {
    require('./App');
    require('./Homepage');
    require('./MenuPage');
    require('./menuData');
  }).not.toThrow();
});

test('menu data is valid', () => {
  const menu = require('./menuData').default;
  expect(Array.isArray(menu)).toBe(true);
  expect(menu.length).toBeGreaterThan(0);
  
  // Validate menu structure
  const flatMenu = menu.flat();
  expect(flatMenu.length).toBeGreaterThan(0);
  
  const firstItem = flatMenu[0];
  expect(firstItem).toHaveProperty('id');
  expect(firstItem).toHaveProperty('name');
  expect(firstItem).toHaveProperty('price');
  expect(firstItem).toHaveProperty('category');
});
