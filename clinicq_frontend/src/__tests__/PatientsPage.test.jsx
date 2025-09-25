import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import PatientsPage from '../pages/PatientsPage';
import api from '../api';

jest.mock('../api');

describe('PatientsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders patients from paginated responses', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        results: [
          {
            registration_number: 101,
            name: 'John Doe',
            gender: 'MALE',
            phone: '555-1234',
          },
        ],
      },
    });

    render(
      <MemoryRouter>
        <PatientsPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('555-1234')).toBeInTheDocument();
  });

  test('renders patients from array responses (search)', async () => {
    api.get
      .mockResolvedValueOnce({ data: { results: [] } })
      .mockResolvedValueOnce({
        data: [
          {
            registration_number: 303,
            name: 'Jane Roe',
            gender: 'FEMALE',
            phone: null,
          },
        ],
      });

    render(
      <MemoryRouter>
        <PatientsPage />
      </MemoryRouter>
    );

    const user = userEvent.setup();
    await user.type(
      screen.getByPlaceholderText(/search by name, phone, or id/i),
      'Jane'
    );
    await user.click(screen.getByRole('button', { name: /search/i }));

    expect(await screen.findByText('Jane Roe')).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();
  });
});
