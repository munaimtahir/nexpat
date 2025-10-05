import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AssistantPage from '../pages/AssistantPage';
import api from '../api';

jest.mock('../api');

test('renders Assistant portal heading', async () => {
  api.get.mockResolvedValue({ data: [] });
  render(
    <MemoryRouter>
      <AssistantPage />
    </MemoryRouter>
  );
  expect(
    await screen.findByRole('heading', {
      name: /Assistant Portal/i,
      level: 1,
    }),
  ).toBeInTheDocument();
});
