# Dynamic Registration Number Format

## Overview
ClinicQ allows administrators to configure the patient registration number format at runtime. The format is defined by a sequence of digit groups and separators. All validation, search, display, and generation logic uses the current configuration immediately after it is saved.

## Configuring the Format
1. Sign in as a doctor-level user and open **Settings → Registration Number Format** in the web app (`/registration-format`).
2. Define the **digit groups** (e.g., `[3, 2, 3]`) and the **separators** that appear between them (e.g., `['-', '-']`).
3. Review the live preview. The screen shows:
   - An example registration number generated from the proposed format.
   - The exact regular expression that will be enforced.
   - The total digit count and formatted length.
4. Address any validation warnings (digit totals ≤ 15, formatted length ≤ 24, non-empty separators, etc.).
5. Click **Save format**. The change is persisted immediately and every connected client updates without a refresh.

## Impact of Changing the Format
- **Patient creation**: Newly generated registration numbers follow the updated format immediately.
- **Validation**: Manual entries must match the current pattern. Attempts to create or update patients with numbers in an old format will be rejected.
- **Search & filters**: Registration number filters and search endpoints accept only values that match the current configuration.
- **Display**: All pages read from the shared format store; numbers render consistently in the latest format without reloads.

## API Endpoints
- `GET /api/settings/registration-format/`
  - Returns the current configuration, including `digit_groups`, `separators`, `total_digits`, `formatted_length`, `pattern`, and `example`.
- `PUT /api/settings/registration-format/`
  - Replaces the configuration. Requires Doctor privileges.
  - Body: `{ "digit_groups": [3,2,3], "separators": ["-", "-"] }`
- `PATCH /api/settings/registration-format/`
  - Partially updates the configuration. Same permissions and payload structure as `PUT`.

Both write endpoints invalidate the cache and broadcast the new format to all running frontends via the shared registration-format store.

## Notes
- Digit groups must sum to ≤ 15 digits; the total formatted length (digits + separator characters) must be ≤ 24 characters.
- Separators can be multi-character strings, but cannot be empty.
- There is no legacy migration path; existing data is expected to comply with the current format.
