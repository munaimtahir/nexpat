// frontend/jest.setup.js
import '@testing-library/jest-dom'; // For expect(...).toBeInTheDocument() etc.
import 'whatwg-fetch'; // Polyfill for fetch

// Ensure Vite-style environment variables are available in tests
process.env.MODE = process.env.MODE || 'test';
// Polyfill for TextEncoder
// Node.js 'util' module should be available in Jest's Node environment
const util = require('util');
global.TextEncoder = util.TextEncoder;
global.TextDecoder = util.TextDecoder; // Also polyfill TextDecoder for completeness

// Polyfill for TransformStream
// Using 'web-streams-polyfill/dist/ponyfill' as it's designed for environments that might not have it globally.
const { TransformStream } = require('web-streams-polyfill/dist/ponyfill');
Object.defineProperty(global, 'TransformStream', {
  writable: true, // Important: make it writable so it can be set
  value: TransformStream,
});

// Mock BroadcastChannel as per user's instruction
class MockBroadcastChannel {
  constructor(name) {
    this.name = name;
    this.onmessage = null;
    this.onmessageerror = null;
    // console.log(`MockBroadcastChannel '${name}' created`);
  }
  postMessage() {
    // console.log(`MockBroadcastChannel '${this.name}' postMessage`);
    // In a more complex mock, you might store messages or simulate cross-instance communication.
  }
  close() {
    // console.log(`MockBroadcastChannel '${this.name}' closed`);
  }
  addEventListener(type, listener) {
    // console.log(`MockBroadcastChannel '${this.name}' addEventListener:`, type);
    if (type === 'message') this._messageListener = listener;
  }
  removeEventListener(type, listener) {
    // console.log(`MockBroadcastChannel '${this.name}' removeEventListener:`, type);
    if (type === 'message' && this._messageListener === listener) this._messageListener = null;
  }
  // Method to simulate receiving a message (for testing purposes if needed)
  _simulateMessage(data) {
    if (this._messageListener) {
      this._messageListener({ data });
    }
  }
}
global.BroadcastChannel = MockBroadcastChannel;

// MSW Server Setup
const { setupServer } = require('msw/node');
const { http, HttpResponse } = require('msw'); // Use http and HttpResponse for MSW v2+

let mockVisits = [];
let nextToken = 1;
let todayDateStr = new Date().toISOString().split('T')[0];

const resetMswData = () => {
  mockVisits = [];
  nextToken = 1;
  todayDateStr = new Date().toISOString().split('T')[0];
};

const server = setupServer(
  http.post('/api/visits/', async ({ request }) => {
    const body = await request.json();
    if (!body.patient_name) {
      return HttpResponse.json({ patient_name: ['This field is required.'] }, { status: 400 });
    }
    const currentToken = nextToken;
    nextToken++;
    const newVisit = {
      id: mockVisits.length + 1, 
      token_number: currentToken, 
      patient_name: body.patient_name,
      patient_gender: body.patient_gender, 
      visit_date: todayDateStr, 
      status: 'WAITING',
      created_at: new Date().toISOString(),
    };
    mockVisits.push(newVisit);
    return HttpResponse.json(newVisit);
  }),
  http.get('/api/visits/', ({ request }) => {
    const url = new URL(request.url);
    const statusParam = url.searchParams.get('status');
    let results = mockVisits;
    if (statusParam) {
      results = mockVisits.filter(
        (visit) => visit.status.toUpperCase() === statusParam.toUpperCase() && visit.visit_date === todayDateStr
      );
      if (statusParam.toUpperCase() === 'WAITING') {
        results.sort((a, b) => a.token_number - b.token_number);
      }
    }
    return HttpResponse.json(results); // status 200 is default
  }),
  http.patch('/api/visits/:id/done/', async ({ params }) => { // params is nested
    const { id } = params;
    const visitIndex = mockVisits.findIndex((v) => v.id === parseInt(id));
    if (visitIndex === -1) return HttpResponse.json({ detail: 'Not found.' }, { status: 404 });
    if (mockVisits[visitIndex].status === 'DONE') {
      return HttpResponse.json({ detail: 'Visit is already marked as done.' }, { status: 400 });
    }
    mockVisits[visitIndex].status = 'DONE';
    return HttpResponse.json(mockVisits[visitIndex]);
  }),
  http.get('/api/network-error-example', () => {
    return HttpResponse.error(); // Simulates a network error
  })
);

// Export for App.test.jsx to use (if it needs to import resetMswData, though setupFile typically doesn't export)
// For now, App.test.jsx will rely on beforeAll/afterEach here.
// If App.test.jsx needs resetMswData, it should import it from a shared module, not the setup file.
// I will move resetMswData to a separate file if needed. For now, assuming tests don't directly import from here.
// The user's original App.test.jsx imported it, so I need to handle this.

// Let's create a simple export mechanism for resetMswData if tests directly import it.
// Normally, tests shouldn't import from setupFilesAfterEnv.
// The previous App.test.jsx imported it, so I will make it available.
global.mswServer = server;
global.resetMswData = resetMswData;


// Jest-axe custom matchers (if not already extended elsewhere)
const { toHaveNoViolations } = require('jest-axe');
expect.extend(toHaveNoViolations);


beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  resetMswData();
});
afterAll(() => server.close());
