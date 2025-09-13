import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DoctorPage from '../pages/DoctorPage';
import api from '../api';

jest.mock('../api');

const mockVisits = [
  {
    id: 1,
    status: 'WAITING',
    token_number: 101,
    patient_full_name: 'John Doe',
    patient_registration_number: 'P001',
  },
  {
    id: 2,
    status: 'START',
    token_number: 102,
    patient_full_name: 'Jane Smith',
    patient_registration_number: 'P002',
  },
  {
    id: 3,
    status: 'IN_ROOM',
    token_number: 103,
    patient_full_name: 'Peter Pan',
    patient_registration_number: 'P003',
  },
];

const mockPatientDetails = {
    P001: { registration_number: 'P001', gender: 'MALE', last_5_visit_dates: [] },
    P002: { registration_number: 'P002', gender: 'FEMALE', last_5_visit_dates: [] },
    P003: { registration_number: 'P003', gender: 'OTHER', last_5_visit_dates: [] },
};

beforeEach(() => {
  api.get.mockImplementation((url) => {
    if (url.includes('/api/visits')) {
      return Promise.resolve({ data: mockVisits });
    }
    if (url.includes('/api/patients')) {
        const regNumbers = url.split('=')[1].split(',');
        const patients = regNumbers.map(reg => mockPatientDetails[reg]).filter(Boolean);
      return Promise.resolve({ data: patients });
    }
    if (url.includes('/api/queues')) {
        return Promise.resolve({ data: [] });
    }
    return Promise.resolve({ data: [] });
  });
  api.patch.mockResolvedValue({ data: {} });
});

test('renders Doctor dashboard and displays visits with correct action buttons', async () => {
  render(
    <MemoryRouter>
      <DoctorPage />
    </MemoryRouter>
  );

  // Check for dashboard heading
  expect(await screen.findByText(/Doctor Dashboard/i)).toBeInTheDocument();

  // Check for WAITING visit and its button
  expect(await screen.findByText(/John Doe/i)).toBeInTheDocument();
  expect(screen.getByText(/Start Consultation/i)).toBeInTheDocument();

  // Check for START visit and its buttons
  expect(await screen.findByText(/Jane Smith/i)).toBeInTheDocument();
  expect(screen.getByText(/Move to Room/i)).toBeInTheDocument();
  expect(screen.getAllByText(/Send Back/i).length).toBeGreaterThan(0);

  // Check for IN_ROOM visit and its buttons
  expect(await screen.findByText(/Peter Pan/i)).toBeInTheDocument();
  expect(screen.getByText(/Mark as Done/i)).toBeInTheDocument();
});

test('clicking "Start Consultation" calls the correct API endpoint', async () => {
    render(
      <MemoryRouter>
        <DoctorPage />
      </MemoryRouter>
    );

    const startButton = await screen.findByText(/Start Consultation/i);
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/api/visits/1/start/');
    });
});

test('clicking "Move to Room" calls the correct API endpoint', async () => {
    render(
      <MemoryRouter>
        <DoctorPage />
      </MemoryRouter>
    );

    const moveButton = await screen.findByText(/Move to Room/i);
    fireEvent.click(moveButton);

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/api/visits/2/in_room/');
    });
});

test('clicking "Mark as Done" calls the correct API endpoint', async () => {
    render(
      <MemoryRouter>
        <DoctorPage />
      </MemoryRouter>
    );

    const doneButton = await screen.findByText(/Mark as Done/i);
    fireEvent.click(doneButton);

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/api/visits/3/done/');
    });
});
