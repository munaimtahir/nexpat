import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DoctorPage from '../pages/DoctorPage';
import api from '../api';

jest.mock('../api');

test('renders Doctor dashboard heading', async () => {
  api.get.mockResolvedValue({ data: [] });
  render(
    <MemoryRouter>
      <DoctorPage />
    </MemoryRouter>
  );
  expect(await screen.findByText(/Doctor Dashboard/i)).toBeInTheDocument();
});
