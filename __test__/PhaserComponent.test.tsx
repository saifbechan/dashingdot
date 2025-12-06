import PhaserComponent from '@/components/PhaserComponent';
import { expect, test } from '@jest/globals';
import { render, screen, within } from '@testing-library/react';

test('renders a phaser canvas correctly', async () => {
  render(<PhaserComponent />);
  const main = within(screen.getByRole('main'));
  expect(await main.findByRole('world')).toBeDefined();
});
