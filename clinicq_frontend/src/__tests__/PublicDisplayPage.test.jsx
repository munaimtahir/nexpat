import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PublicDisplayPage from '../pages/PublicDisplayPage';
import axios from 'axios';

jest.mock('axios');

test('renders Public Display heading', async () => {
  axios.get.mockResolvedValue({ data: [] });
  const { unmount } = render(
    <MemoryRouter>
      <PublicDisplayPage />
    </MemoryRouter>
  );
  expect(await screen.findByText(/Now Serving/i)).toBeInTheDocument();
});
