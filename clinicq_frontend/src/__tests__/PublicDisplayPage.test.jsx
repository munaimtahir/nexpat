import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PublicDisplayPage from '../pages/PublicDisplayPage';
import api from '../api';

jest.mock('../api');

test('renders Public Display heading', async () => {
  api.get.mockResolvedValue({ data: [] });
  const { unmount } = render(
    <MemoryRouter>
      <PublicDisplayPage />
    </MemoryRouter>
  );
  expect(await screen.findByText(/Now Serving/i)).toBeInTheDocument();
});
