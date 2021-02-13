import { render, screen, waitFor } from '@testing-library/react';

import Index from '../pages/index';

test('renders a phaser canvas correctly', async () => {
  render(<Index />);
  await waitFor(() => screen.getByTestId('phaser'));
  expect(screen.getByTestId('phaser')).toBeInTheDocument();
});
