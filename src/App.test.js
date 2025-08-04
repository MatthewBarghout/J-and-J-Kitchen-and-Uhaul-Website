import { render } from '@testing-library/react';
import App from './App';

test('renders app without crashing', () => {
  render(<App />);
  // Just test that the app renders without crashing
  expect(true).toBe(true);
});
