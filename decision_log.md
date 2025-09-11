# Decision Log

This file records notable design decisions and changes.

Format: Date | Stage | Decision

---
2025-09-10 | Stage 1 | Prescription Upload Policy: Set to Doctor-only. Moved upload functionality from AssistantPage to DoctorPage. Created an extensible IsDoctorOrUploader permission class for future flexibility.
2025-09-10 | Stage 1 | Django Admin: Registered Patient, Queue, and PrescriptionImage models with sensible defaults for list_display, search_fields, and filters.
2025-09-10 | Stage 1 | Frontend Base URL: Updated api.js to use VITE_API_BASE_URL environment variable for API requests.
2025-09-10 | Stage 1 | Models Cleanup: No '...' placeholders found in models. Models appear to be complete.
2025-09-10 | Stage 1 | Migration 0003: Reviewed migration 0003 and found it to be complete and reversible. The forwards pass correctly backfills data, and the backwards pass safely reverts the changes. No code changes were necessary.
2025-09-11 | Stage 1 | Merge Resolution: Resolved merge conflicts between stage1/core-fixes and main. Cleaned up compiled artifacts and ensured all Stage 1 features are correctly implemented as per user instructions.
