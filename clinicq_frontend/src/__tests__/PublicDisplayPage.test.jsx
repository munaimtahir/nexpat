import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PublicDisplayPage from '../pages/PublicDisplayPage';
import api from '../api';

jest.mock('../api');

const mockVisits = [
  {
    id: 1,
    status: 'IN_ROOM',
    token_number: 101,
    patient_full_name: 'John Doe',
  },
  {
    id: 2,
    status: 'WAITING',
    token_number: 102,
    patient_full_name: 'Jane Smith',
  },
  {
    id: 3,
    status: 'WAITING',
    token_number: 103,
    patient_full_name: 'Peter Pan',
  },
];

beforeEach(() => {
  api.get.mockImplementation((url) => {
    if (url.includes('/visits')) {
      return Promise.resolve({ data: { results: mockVisits } });
    }
    if (url.includes('/queues')) {
      return Promise.resolve({ data: [] });
    }
    return Promise.resolve({ data: [] });
  });
});

test('renders Public Display and shows IN_ROOM and WAITING patients correctly', async () => {
  render(
    <MemoryRouter>
      <PublicDisplayPage />
    </MemoryRouter>
  );

  // Check for heading
  expect(await screen.findByText(/Clinic Queue Display/i)).toBeInTheDocument();

  // Check for IN_ROOM patient
  expect(await screen.findByText(/In Consultation Room/i)).toBeInTheDocument();
  expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
  expect(screen.getByText(/101/i)).toBeInTheDocument();

  // Check for WAITING patients
  expect(await screen.findByText(/Waiting Patients/i)).toBeInTheDocument();
  expect(screen.getByText(/Jane Smith/i)).toBeInTheDocument();
  expect(screen.getByText(/102/i)).toBeInTheDocument();
  expect(screen.getByText(/Peter Pan/i)).toBeInTheDocument();
  expect(screen.getByText(/103/i)).toBeInTheDocument();
});

test('shows correct message when no patients are present', async () => {
  api.get.mockImplementation((url) => {
    if (url.includes('/visits')) {
      return Promise.resolve({ data: { results: [] } });
    }
    if (url.includes('/queues')) {
      return Promise.resolve({ data: [] });
    }
    return Promise.resolve({ data: [] });
  });

  render(
    <MemoryRouter>
      <PublicDisplayPage />
    </MemoryRouter>
  );

  expect(await screen.findByText(/No patient is currently in the room./i)).toBeInTheDocument();
  expect(await screen.findByText(/The waiting queue is empty./i)).toBeInTheDocument();
});
