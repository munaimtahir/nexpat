import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { axe } from 'jest-axe';
import App from './App';
import AssistantPage from './pages/AssistantPage';
import DoctorPage from './pages/DoctorPage';
import PublicDisplayPage from './pages/PublicDisplayPage';
import axios from 'axios';

jest.mock('axios');

describe('Page Smoke Tests and Basic Accessibility', () => {
  beforeEach(() => {
    axios.get.mockResolvedValue({ data: [] });
    axios.post.mockResolvedValue({ data: {} });
    axios.patch.mockResolvedValue({ data: {} });
  });

  const pages = [
    { name: 'Assistant Page', path: '/assistant', Component: AssistantPage },
    { name: 'Doctor Page', path: '/doctor', Component: DoctorPage },
    { name: 'Public Display Page', path: '/display', Component: PublicDisplayPage },
  ];

  pages.forEach((page) => {
    test(`${page.name} renders without crashing and has no basic a11y violations`, async () => {
      const { container } = render(
        <MemoryRouter initialEntries={[page.path]}>
          <Routes>
            <Route path={page.path} element={<page.Component />} />
          </Routes>
        </MemoryRouter>
      );
      await waitFor(() => expect(container).toBeInTheDocument());
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});

describe('Displays last_5_visit_dates', () => {
  beforeEach(() => {
    axios.get.mockReset();
    axios.post.mockReset();
    axios.patch.mockReset();
  });

  test('Assistant page shows last visit dates for patient', async () => {
    axios.get.mockImplementation((url) => {
      if (url === '/api/queues/') {
        return Promise.resolve({ data: [{ id: 1, name: 'General' }] });
      }
      if (url.startsWith('/api/patients/search/')) {
        return Promise.resolve({ data: [{ registration_number: 1 }] });
      }
      if (url === '/api/patients/1/') {
        return Promise.resolve({
          data: {
            registration_number: 1,
            name: 'Alice',
            gender: 'FEMALE',
            last_5_visit_dates: ['2024-01-01'],
          },
        });
      }
      return Promise.resolve({ data: [] });
    });
    axios.post.mockResolvedValue({ data: { token_number: 5 } });

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/assistant']}>
        <App />
      </MemoryRouter>
    );

    const regInput = screen.getByLabelText(/Registration Number/i);
    await user.type(regInput, '1');
    const queueSelect = screen.getByLabelText(/Queue/i);
    await user.selectOptions(queueSelect, '1');

    await waitFor(() => {
      expect(screen.getByText(/Last Visits:/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Generate Token/i }));
    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  test('Doctor page shows last visit dates for waiting patients', async () => {
    axios.get.mockImplementation((url) => {
      if (url === '/api/visits/?status=WAITING') {
        return Promise.resolve({
          data: [
            {
              id: 1,
              token_number: 10,
              patient_name: 'Alice',
              patient_gender: 'FEMALE',
              patient_registration_number: 1,
            },
          ],
        });
      }
      if (url === '/api/patients/1/') {
        return Promise.resolve({
          data: {
            registration_number: 1,
            last_5_visit_dates: ['2024-01-01', '2023-12-31'],
          },
        });
      }
      return Promise.resolve({ data: [] });
    });

    render(
      <MemoryRouter initialEntries={['/doctor']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Last Visits:/i)).toBeInTheDocument();
    });
  });
});
