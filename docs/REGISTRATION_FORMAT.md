# Registration Number Format Implementation

## Overview

This document describes the implementation of the permanent registration number format `mmyy-ct-0000` for the ClinicQ system, replacing the previous dynamic format configuration.

## New Format

### Format: `mmyy-ct-0000`

- **mmyy** (4 digits): Month and year of registration
  - Example: `1025` = October 2025, `0126` = January 2026
  - Automatically set based on the current date when patient is registered

- **ct** (2 digits): Patient category code
  - `01` = Self-paying
  - `02` = Insurance
  - `03` = Cash
  - `04` = Free
  - `05` = Poor

- **0000** (4 digits): Serial number
  - Zero-padded to 4 digits
  - Unique and incremental within each mmyy/ct combination
  - Resets to 0001 for each new month or category
  - Maximum 9999 patients per category per month

### Examples

- `1025-01-0001` - First self-paying patient registered in October 2025
- `1025-02-0001` - First insurance patient registered in October 2025
- `1025-01-0002` - Second self-paying patient registered in October 2025
- `1125-01-0001` - First self-paying patient registered in November 2025

## Implementation Details

### Backend Changes

#### Patient Model (`apps/backend/api/models.py`)

**Added Fields:**
- `category` (CharField): Patient payment category, required field with choices

**Modified Methods:**
- `generate_next_registration_number(category)`: Now generates registration numbers based on current month/year and provided category
- `save()`: Passes category to generation method

**Removed:**
- `RegistrationNumberFormat` model
- `get_registration_number_format()` function
- `validate_registration_number_format()` with dynamic pattern
- `ensure_format_can_fit_existing_patients()` function
- `reformat_patients_to_format()` function

**Updated:**
- `validate_registration_number_format()`: Now validates against fixed pattern `^\d{4}-\d{2}-\d{4}$`

#### API Changes (`apps/backend/api/views.py`, `apps/backend/api/urls.py`)

**Removed:**
- `RegistrationNumberFormatView` class
- `/api/settings/registration-format/` endpoint

**Updated:**
- Patient filtering and search now use fixed pattern
- Removed backward compatibility for old numeric format

#### Serializers (`apps/backend/api/serializers.py`)

**Removed:**
- `RegistrationNumberFormatSerializer`

**Updated:**
- `PatientSerializer`: Added `category` field to fields list

#### Migration (`apps/backend/api/migrations/0011_delete_registrationnumberformat_patient_category.py`)

**Actions:**
1. Deletes `RegistrationNumberFormat` model
2. Adds `category` field to Patient model (default: '01')
3. Converts existing registration numbers to new format:
   - Uses current month/year for all conversions
   - Assigns category '01' (Self-paying) to all existing patients
   - Assigns sequential serial numbers

### Frontend Changes

#### Web Application (`apps/web/`)

**Removed Files:**
- `src/pages/RegistrationFormatSettingsPage.jsx`
- `src/hooks/useRegistrationFormat.js`
- `src/utils/registrationFormat.js`

**Updated Files:**
- `src/App.jsx`: Removed registration format settings route and import
- `src/pages/PatientFormPage.jsx`: Added category selection dropdown

**Category Selection UI:**
```javascript
const categories = [
  { value: '01', label: 'Self-paying' },
  { value: '02', label: 'Insurance' },
  { value: '03', label: 'Cash' },
  { value: '04', label: 'Free' },
  { value: '05', label: 'Poor' },
];
```

#### Mobile Application (`apps/mobile/`)

**Status:** Documented but not implemented
- Generated API types need to be regenerated from backend OpenAPI schema
- See `apps/mobile/MIGRATION_NOTES.md` for detailed migration guide
- Requires updating PatientFormScreen to include category picker

### Testing

All backend tests updated and passing:
- `RegistrationNumberFormatTests`: Tests for format validation and auto-generation
- `PatientFilterTests`: Tests for filtering by registration number
- `PatientSearchTests`: Tests for searching patients
- `PatientCRUDTests`: Tests for create, read, update, delete operations
- `VisitTests`: Tests for visit creation and management

**Test Coverage:**
- ✅ Registration number format validation (`^\d{4}-\d{2}-\d{4}$`)
- ✅ Auto-generation with current month/year
- ✅ Serial number sequencing per category
- ✅ Different categories start at serial 0001
- ✅ Patient creation with explicit registration numbers
- ✅ Patient filtering and search

### Documentation

**Updated Files:**
- `CHANGELOG.md`: Added entry for format change
- `docs/references/api.md`: Updated Patient model documentation
- `apps/mobile/MIGRATION_NOTES.md`: Created mobile app migration guide

## Migration Guide

### For Existing Installations

1. **Backup database** before applying migration
2. Run `python manage.py migrate` to apply migration 0011
3. All existing patients will:
   - Retain their original registration numbers temporarily
   - Be converted to format `MMYY-01-NNNN` where:
     - `MMYY` is current month/year
     - `01` is default category (Self-paying)
     - `NNNN` is sequential number based on original order
4. Update web frontend deployment
5. Clear browser local storage if needed

### For New Installations

No special steps required - just apply all migrations normally.

## API Usage Examples

### Create Patient

```bash
POST /api/patients/
Content-Type: application/json

{
  "name": "John Doe",
  "phone": "1234567890",
  "gender": "MALE",
  "category": "01"
}
```

**Response:**
```json
{
  "registration_number": "1025-01-0001",
  "name": "John Doe",
  "phone": "1234567890",
  "gender": "MALE",
  "category": "01",
  "created_at": "2025-10-05T13:45:00Z",
  "updated_at": "2025-10-05T13:45:00Z",
  "last_5_visit_dates": []
}
```

### Update Patient

```bash
PATCH /api/patients/1025-01-0001/
Content-Type: application/json

{
  "category": "02"
}
```

### Search Patient

```bash
GET /api/patients/search/?q=1025-01-0001
```

## Validation Rules

1. **Format:** Must match `^\d{4}-\d{2}-\d{4}$`
2. **Category:** Must be one of: 01, 02, 03, 04, 05
3. **Auto-generation:** Registration number cannot be provided on create
4. **Uniqueness:** Enforced by database primary key constraint

## Performance Considerations

- Serial number lookup is optimized using database prefix filtering
- No performance impact compared to previous dynamic format
- Category-based partitioning allows for better data organization

## Future Enhancements

Potential improvements for future versions:
1. Add more category codes as needed
2. Implement category-based reporting and statistics
3. Add ability to customize category labels per clinic
4. Add validation for month/year in registration numbers

## Troubleshooting

### Common Issues

**Issue:** Registration number format validation error
- **Cause:** Old format still being used
- **Solution:** Clear browser cache and local storage

**Issue:** Serial number collision
- **Cause:** Database not synchronized
- **Solution:** Check database for duplicate entries, regenerate if needed

**Issue:** Migration fails
- **Cause:** Existing data incompatible
- **Solution:** Check migration logs, manually fix data if needed

## Related Pull Requests

- PR #165: Implement permanent registration number format

## Contact

For questions or issues, please open an issue on GitHub.
