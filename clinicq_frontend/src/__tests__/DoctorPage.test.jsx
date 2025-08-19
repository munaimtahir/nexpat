import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DoctorPage from '../pages/DoctorPage';
import axios from 'axios';

jest.mock('axios');

test('renders Doctor dashboard heading', async () => {
  axios.get.mockResolvedValue({ data: [] });
  render(
    <MemoryRouter>
      <DoctorPage />
    </MemoryRouter>
  );
  expect(await screen.findByText(/Doctor Dashboard/i)).toBeInTheDocument();
});
