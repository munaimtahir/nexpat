import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import useRegistrationFormat from '../hooks/useRegistrationFormat.js';
import api from '../api.js';

jest.mock('../api.js');

const STORAGE_KEY = 'registration_number_format';

const TestViewer = () => {
  const { format, loading } = useRegistrationFormat();
  return <div data-testid="pattern">{loading ? 'loading' : format?.pattern ?? 'none'}</div>;
};

const TestSetter = () => {
  const { setFormat } = useRegistrationFormat();
  return (
    <button
      type="button"
      onClick={() =>
        setFormat({
          digit_groups: [4, 2],
          separators: [' / '],
          total_digits: 6,
          formatted_length: 9,
          pattern: '^\\d{4} / \\d{2}$',
          example: '1234 / 56',
        })
      }
    >
      Update format
    </button>
  );
};

beforeEach(() => {
  window.localStorage.clear();
  api.get.mockResolvedValue({
    data: {
      digit_groups: [3, 2, 3],
      separators: ['-', '-'],
      total_digits: 8,
      formatted_length: 10,
      pattern: '^\\d{3}-\\d{2}-\\d{3}$',
      example: '123-45-678',
    },
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

test('setFormat updates all subscribers and localStorage', async () => {
  const user = userEvent.setup();
  render(
    <>
      <TestViewer />
      <TestSetter />
    </>
  );

  await waitFor(() => {
    expect(screen.getByTestId('pattern')).toHaveTextContent('^\\d{3}-\\d{2}-\\d{3}$');
  });

  await user.click(screen.getByRole('button', { name: /update format/i }));

  await waitFor(() => {
    expect(screen.getByTestId('pattern')).toHaveTextContent('^\\d{4} / \\d{2}$');
  });

  const stored = window.localStorage.getItem(STORAGE_KEY);
  expect(stored).not.toBeNull();
  expect(JSON.parse(stored).pattern).toBe('^\\d{4} / \\d{2}$');
});
