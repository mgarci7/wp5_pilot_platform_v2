# Changelog

## [1.1.0] - 2026-03-10

### New Feature: Edit Experiment Button

Added the ability to edit existing experiments after creation, allowing researchers to modify parameters without recreating the entire experiment.

#### What's New

- **Edit Experiment Button** in Dashboard Overview tab
- Opens wizard with pre-loaded experiment configuration
- Modify simulation settings, LLM parameters, treatment groups, and schedule
- Experiment ID remains locked (cannot be changed after creation)
- Tokens are preserved when editing (no regeneration required)

#### Files Modified

| File | Changes |
|------|---------|
| `backend/main.py` | Added `PUT /admin/config/{experiment_id}` endpoint (lines 720-781), added PUT to CORS allowed methods (line 122) |
| `backend/db/repositories/config_repo.py` | Added `update_experiment_config()` function (lines 240-263) |
| `frontend/lib/admin-api.ts` | Added `updateConfig()` function (lines 94-114), updated `getExperimentConfig` return type |
| `frontend/components/admin/Dashboard.tsx` | Added `onEditExperiment` prop, added "Edit Experiment" button (lines 297-302) |
| `frontend/components/admin/AdminPanel.tsx` | Added edit mode state management, `handleEditExperiment` callback (lines 328-349) |
| `frontend/components/admin/steps/StepExperiment.tsx` | Added `isEditing` prop, disabled experiment ID when editing (lines 61, 68-69) |

#### Bug Fixes

- **CORS Error on PUT requests**: Fixed "Failed to fetch" error when saving edits by adding PUT to CORS allowed methods in `backend/main.py`

---

## How to Use

### Editing an Experiment

1. Go to the Admin Dashboard (`/admin`)
2. Select an experiment from the dropdown
3. In the Overview tab, click **"Edit Experiment"**
4. Modify any parameters in the wizard steps:
   - Step 1: Description and schedule (ID is locked)
   - Step 2: Session settings
   - Step 3: LLM configuration
   - Step 4: Treatment groups
   - Step 5: Tokens (skipped when editing)
   - Step 6: Review and save
5. Click **"Save"** to apply changes

### Important Notes

- Experiment ID cannot be changed after creation
- Existing tokens are preserved (no regeneration)
- LLM tests are auto-passed when editing (previously validated)
- Changes take effect immediately after saving

---

## Installation

```bash
git clone https://github.com/Alejandrofuentecuesta/wp5_pilot_platform.git
cd wp5_pilot_platform
docker compose up --build
```

Access the admin panel at: `http://localhost:3000/admin`
