import { render, screen } from '@testing-library/react';
import App from './App';

test('renders J and J Kitchen app', () => {
  render(<App />);
  const titleElement = screen.getByText(/J and J Kitchen/i);
  expect(titleElement).toBeInTheDocument();
});
