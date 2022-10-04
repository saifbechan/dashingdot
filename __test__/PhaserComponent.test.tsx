import { expect, test } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import PhaserComponent from '../components/PhaserComponent';

test('renders a phaser canvas correctly', async () => {
  render(<PhaserComponent />);
  const main = within(screen.getByRole('main'));
  expect(main.getByRole('world')).toBeDefined();
});
