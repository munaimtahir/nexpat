import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { axe } from 'jest-axe';
import App from './App'; // Your main App component that includes routing
import AssistantPage from './pages/AssistantPage';
import DoctorPage from './pages/DoctorPage';
import PublicDisplayPage from './pages/PublicDisplayPage';
// server and resetMswData are now global, set up in jest.setup.js
import { http, HttpResponse } from 'msw'; // Update to http and HttpResponse


describe('Page Smoke Tests and Basic Accessibility', () => {
  const pages = [
    { name: 'Assistant Page', path: '/assistant', Component: AssistantPage },
    { name: 'Doctor Page', path: '/doctor', Component: DoctorPage },
    { name: 'Public Display Page', path: '/display', Component: PublicDisplayPage },
  ];

  pages.forEach(page => {
    test(`${page.name} renders without crashing and has no basic a11y violations`, async () => {
      const { container } = render(
        <MemoryRouter initialEntries={[page.path]}>
          <Routes>
            <Route path={page.path} element={<page.Component />} />
          </Routes>
        </MemoryRouter>
      );
      expect(container).toBeInTheDocument();

      // Perform accessibility check
      // Wrap in act if there are state updates causing a11y issues after initial render
      let results;
      await act(async () => {
        results = await axe(container);
      });
      expect(results).toHaveNoViolations();
    });
  });
});

describe('Clinic Queue Full Workflow Test', () => {
  beforeEach(() => {
    // global.resetMswData is from jest.setup.js
    if (global.resetMswData) global.resetMswData(); // Ensure clean mock data
  });

  test('issues a token, doctor marks it done, and public display updates', async () => {
    // Temporarily mock axios for this test to fix the MSW issue
    const originalAxios = require('axios');
    const axiosPost = jest.spyOn(originalAxios, 'post');
    const axiosGet = jest.spyOn(originalAxios, 'get');
    const axiosPatch = jest.spyOn(originalAxios, 'patch');
    
    // Mock visit creation
    axiosPost.mockResolvedValueOnce({
      data: {
        id: 1,
        token_number: 1,
        patient: 1,
        queue: 1,
        patient_name: 'Happy Path User',
        patient_gender: 'FEMALE',
        visit_date: '2025-07-07',
        status: 'WAITING',
        created_at: new Date().toISOString(),
      },
      status: 201,
    });
    
    // Mock getting waiting visits (for doctor page) - initially has the visit, then empty after marking done
    let visitMarkedDone = false;
    axiosGet.mockImplementation((url) => {
      if (url.includes('/api/visits/') && url.includes('status=WAITING')) {
        if (visitMarkedDone) {
          return Promise.resolve({ data: [], status: 200 });
        }
        return Promise.resolve({
          data: [{
            id: 1,
            token_number: 1,
            patient_name: 'Happy Path User',
            patient_gender: 'FEMALE',
            visit_date: '2025-07-07',
            status: 'WAITING',
            created_at: new Date().toISOString(),
          }],
          status: 200,
        });
      }
      if (url.includes('/api/queues/')) {
        return Promise.resolve({ data: [ { id: 1, name: 'General' } ], status: 200 });
      }
      if (url.includes('/api/patients/search/')) {
        return Promise.resolve({ data: [ { id: 1, registration_number: 'RN123', name: 'Happy Path User', gender: 'FEMALE' } ], status: 200 });
      }
      return Promise.resolve({ data: [], status: 200 });
    });
    
    // Mock marking visit as done
    axiosPatch.mockImplementation((url) => {
      if (url.includes('/api/visits/') && url.includes('/done/')) {
        visitMarkedDone = true; // Update state so subsequent GET requests return empty
        return Promise.resolve({
          data: {
            id: 1,
            token_number: 1,
            patient_name: 'Happy Path User',
            patient_gender: 'FEMALE',
            visit_date: '2025-07-07',
            status: 'DONE',
            created_at: new Date().toISOString(),
          },
          status: 200,
        });
      }
      return Promise.resolve({ data: {}, status: 200 });
    });
        
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    // --- 1. Navigate to Assistant Page and Issue Token ---
    await user.click(screen.getByRole('link', { name: /Assistant Portal/i }));
    expect(screen.getByRole('heading', { name: /Assistant Portal/i })).toBeInTheDocument();

    const regInput = screen.getByLabelText(/Registration Number/i);
    await user.type(regInput, 'RN123');
    await waitFor(() => expect(regInput).toHaveValue('RN123'));
    await user.selectOptions(screen.getByLabelText(/Queue/i), '1');
    // Try wrapping the click/submit in act
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /Generate Token/i }));
    });

    // Wait for token generation success
    const generatedTokenElement = await screen.findByText(/Token Generated Successfully!/i);
    expect(generatedTokenElement).toBeInTheDocument();
    const tokenNumberElement = await screen.findByText('1'); // MSW mock will generate token 1
    expect(tokenNumberElement).toBeInTheDocument();
    const patientNameInTokenDisplay = await screen.findByText('1'); // Assuming token number is displayed
    expect(patientNameInTokenDisplay).toBeVisible();


    // --- 2. Navigate to Doctor Page and Verify Token ---
    // First, go back "home" to click the next link, or directly navigate if your app structure allows
    await user.click(screen.getByRole('link', { name: /Back to Home/i }));
    await user.click(screen.getByRole('link', { name: /Doctor Dashboard/i }));

    expect(screen.getByRole('heading', { name: /Doctor Dashboard/i })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/Token: 1/i)).toBeInTheDocument();
      expect(screen.getByText(/Patient: Happy Path User/i)).toBeInTheDocument();
    });

    // --- 3. Doctor Marks Token as Done ---
    const markDoneButton = screen.getByRole('button', { name: /Mark as Done/i });
    await user.click(markDoneButton);

    // Wait for the list to update (item should be removed)
    await waitFor(() => {
      expect(screen.queryByText(/Token: 1/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Patient: Happy Path User/i)).not.toBeInTheDocument();
      expect(screen.getByText(/No patients currently waiting./i)).toBeInTheDocument();
    });

    // --- 4. Navigate to Public Display Page and Verify Update ---
    // Go back "home"
    await user.click(screen.getByRole('link', { name: /Back to Home/i }));
    await user.click(screen.getByRole('link', { name: /Public Queue Display/i }));

    expect(screen.getByRole('heading', { name: /Now Serving/i })).toBeInTheDocument();

    // Wait for the display to settle (it might initially show old data then refresh)
    // The MSW handler for GET /api/visits/?status=WAITING should now return an empty list
    await waitFor(() => {
        expect(screen.getByText(/No patients currently waiting./i)).toBeInTheDocument();
    }, { timeout: 6000 }); // Public display refreshes every 5s, give it time

    // Accessibility check for the final state of public display
    let publicDisplayContainer = screen.getByText(/Now Serving/i).closest('div.container');
    if (!publicDisplayContainer) publicDisplayContainer = document.body; // fallback
    let axeResults;
    await act(async () => {
        axeResults = await axe(publicDisplayContainer);
    });
    expect(axeResults).toHaveNoViolations();
    
    // Cleanup the axios mocks
    axiosPost.mockRestore();
    axiosGet.mockRestore();
    axiosPatch.mockRestore();
  });


  test('displays network error if API fails on Assistant Page', async () => {
    // global.mswServer is the server instance from jest.setup.js
    global.mswServer.use(
      http.post('/api/visits/', () => {
        return HttpResponse.error(); // Simulate network error
      })
    );

    const originalAxios = require('axios');
    const axiosGet = jest.spyOn(originalAxios, 'get');
    axiosGet.mockImplementation((url) => {
      if (url.includes('/api/queues/')) {
        return Promise.resolve({ data: [{ id: 1, name: 'General' }], status: 200 });
      }
      if (url.includes('/api/patients/search/')) {
        return Promise.resolve({ data: [{ id: 2, registration_number: 'RN999', name: 'Error Test User', gender: 'MALE' }], status: 200 });
      }
      return Promise.resolve({ data: [], status: 200 });
    });

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    // Ensure HomePage is rendered before trying to click the link
    await screen.findByRole('heading', { name: /ClinicQ/i, level: 1 });
    await user.click(screen.getByRole('link', { name: /Assistant Portal/i }));

    const regInput = screen.getByLabelText(/Registration Number/i);
    await user.type(regInput, 'RN999');
    await waitFor(() => expect(regInput).toHaveValue('RN999'));
    fireEvent.change(screen.getByLabelText(/Queue/i), { target: { value: '1' } });
    // Try wrapping the click/submit in act
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /Generate Token/i }));
    });

    expect(await screen.findByText(/Failed to generate token/i)).toBeInTheDocument();
    axiosGet.mockRestore();
  });

  // Additional focused tests to improve coverage
  test('shows validation error when registration number is empty', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    
    await user.click(screen.getByRole('link', { name: /Assistant Portal/i }));
    
    // Leave registration number empty and try to submit
    fireEvent.change(screen.getByLabelText(/Queue/i), { target: { value: '1' } });
    await user.click(screen.getByRole('button', { name: /Generate Token/i }));

    // Should show validation error
    expect(await screen.findByText(/Registration number cannot be empty/i)).toBeInTheDocument();
  });

  test('handles invalid token response gracefully', async () => {
    // Mock axios to return invalid token
    const originalAxios = require('axios');
    const axiosPost = jest.spyOn(originalAxios, 'post');
    axiosPost.mockResolvedValueOnce({
      data: { token_number: null }, // Invalid token
      status: 201,
    });
    const axiosGet = jest.spyOn(originalAxios, 'get');
    axiosGet.mockImplementation((url) => {
      if (url.includes('/api/queues/')) {
        return Promise.resolve({ data: [{ id: 1, name: 'General' }], status: 200 });
      }
      if (url.includes('/api/patients/search/')) {
        return Promise.resolve({ data: [{ id: 1, registration_number: 'RN123', name: 'Test User', gender: 'MALE' }], status: 200 });
      }
      return Promise.resolve({ data: [], status: 200 });
    });
    
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    
    await user.click(screen.getByRole('link', { name: /Assistant Portal/i }));
    
    const regInput = screen.getByLabelText(/Registration Number/i);
    await user.type(regInput, 'RN123');
    fireEvent.change(screen.getByLabelText(/Queue/i), { target: { value: '1' } });
    await user.click(screen.getByRole('button', { name: /Generate Token/i }));
    
    // Should show error for invalid token format
    expect(await screen.findByText(/Received invalid token format from server/i)).toBeInTheDocument();
    expect(await screen.findByText(/N\/A/i)).toBeInTheDocument(); // Should show N/A

    axiosPost.mockRestore();
    axiosGet.mockRestore();
  });

  test('displays server validation errors correctly', async () => {
    // Mock axios to return server validation errors
    const originalAxios = require('axios');
    const axiosPost = jest.spyOn(originalAxios, 'post');
    axiosPost.mockRejectedValueOnce({
      response: {
        data: {
          patient: ['This field is required.'],
          queue: ['Invalid choice.']
        }
      }
    });
    const axiosGet = jest.spyOn(originalAxios, 'get');
    axiosGet.mockImplementation((url) => {
      if (url.includes('/api/queues/')) {
        return Promise.resolve({ data: [{ id: 1, name: 'General' }], status: 200 });
      }
      if (url.includes('/api/patients/search/')) {
        return Promise.resolve({ data: [{ id: 1, registration_number: 'RN123', name: 'Test User', gender: 'MALE' }], status: 200 });
      }
      return Promise.resolve({ data: [], status: 200 });
    });
    
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    
    await user.click(screen.getByRole('link', { name: /Assistant Portal/i }));
    
    const regInput = screen.getByLabelText(/Registration Number/i);
    await user.type(regInput, 'RN123');
    fireEvent.change(screen.getByLabelText(/Queue/i), { target: { value: '1' } });
    await user.click(screen.getByRole('button', { name: /Generate Token/i }));

    // Should show parsed server errors
    expect(await screen.findByText(/Failed to generate token.*patient.*queue/i)).toBeInTheDocument();

    axiosPost.mockRestore();
    axiosGet.mockRestore();
  });

  test('doctor page handles API errors gracefully', async () => {
    // Mock axios to simulate fetch error  
    const originalAxios = require('axios');
    const axiosGet = jest.spyOn(originalAxios, 'get');
    axiosGet.mockRejectedValueOnce(new Error('Network error'));
    
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    
    await user.click(screen.getByRole('link', { name: /Doctor Dashboard/i }));
    
    // Should show error message
    expect(await screen.findByText(/Failed to fetch waiting visits/i)).toBeInTheDocument();
    
    axiosGet.mockRestore();
  });

  test('doctor page handles mark as done API errors', async () => {
    // First mock successful fetch, then failed mark as done
    const originalAxios = require('axios');
    const axiosGet = jest.spyOn(originalAxios, 'get');
    const axiosPatch = jest.spyOn(originalAxios, 'patch');
    
    axiosGet.mockResolvedValue({
      data: [{
        id: 1,
        token_number: 1,
        patient_name: 'Test Patient',
        patient_gender: 'MALE',
        visit_date: '2025-07-07',
        status: 'WAITING',
      }],
      status: 200,
    });
    
    axiosPatch.mockRejectedValueOnce({
      response: { data: { detail: 'Visit already marked as done.' } }
    });
    
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    
    await user.click(screen.getByRole('link', { name: /Doctor Dashboard/i }));
    
    // Wait for visit to load, then try to mark as done
    await waitFor(() => {
      expect(screen.getByText(/Token: 1/i)).toBeInTheDocument();
    });
    
    await user.click(screen.getByRole('button', { name: /Mark as Done/i }));
    
    // Should show error message
    expect(await screen.findByText(/Failed to mark token as done.*Visit already marked as done/i)).toBeInTheDocument();
    
    axiosGet.mockRestore();
    axiosPatch.mockRestore();
  });

  test('public display page shows multiple visits correctly', async () => {
    // Mock axios to return multiple visits
    const originalAxios = require('axios');
    const axiosGet = jest.spyOn(originalAxios, 'get');
    
    // Return multiple visits for all GET requests
    axiosGet.mockResolvedValue({
      data: [
        { id: 1, token_number: 1, patient_name: 'First Patient', patient_gender: 'MALE' },
        { id: 2, token_number: 2, patient_name: 'Second Patient', patient_gender: 'FEMALE' },
        { id: 3, token_number: 3, patient_name: 'Third Patient', patient_gender: 'OTHER' },
      ],
      status: 200,
    });
    
    render(
      <MemoryRouter initialEntries={['/display']}>
        <App />
      </MemoryRouter>
    );
    
    // Should show multiple visits and "Next in Queue" section
    await waitFor(() => {
      expect(screen.getAllByText(/First Patient/)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/Second Patient/)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/Third Patient/)[0]).toBeInTheDocument();
    }, { timeout: 3000 });
    
    axiosGet.mockRestore();
  });

});
