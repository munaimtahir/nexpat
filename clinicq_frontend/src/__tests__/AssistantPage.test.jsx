import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AssistantPage from '../pages/AssistantPage';
import axios from 'axios';

jest.mock('axios');

test('renders Assistant portal heading', async () => {
  axios.get.mockResolvedValue({ data: [] });
  render(
    <MemoryRouter>
      <AssistantPage />
    </MemoryRouter>
  );
  expect(await screen.findByText(/Assistant Portal/i)).toBeInTheDocument();
});
