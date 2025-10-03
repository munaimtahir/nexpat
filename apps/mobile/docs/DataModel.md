# Data Model Overview
- User: { id, username, roles[] }
- Patient: { id, name, phone, reg_no, age, sex, ... }
- Visit: { id, patient_id, status: (waiting|called|with_doctor|done|no_show), notes?, created_at, updated_at }
- Prescription: { id, patient_id, visit_id?, image_url, created_at }
- Server emits revisions/updated_at timestamps used for conflict resolution (server wins).
