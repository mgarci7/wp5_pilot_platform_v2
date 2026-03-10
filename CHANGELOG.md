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

---

## [1.0.0] - Previous Fixes

### 1. Inconsistent Agent Personalities

**Problem:** Agents contradicted themselves and did not maintain coherent behavior during conversation.

**Cause:** The system only had agent names without defining individual personalities. The Director had no information to maintain consistency.

**Solution:**
- Added `persona` field to Agent model
- Modified Director prompt to include personalities
- Added UI in Admin Panel to define personalities per agent
- Explicit instruction to Director: "Maintain consistency - each agent should stay true to their personality traits"

**Files modified:**
- `backend/models/agent.py`
- `backend/agents/STAGE/director.py`
- `backend/platforms/chatroom.py`
- `frontend/lib/admin-types.ts`
- `frontend/components/admin/steps/StepSession.tsx`
- `frontend/components/admin/AdminPanel.tsx`

---

### 2. Tedious Experiment Configuration

**Problem:** All fields had to be filled manually each time, very slow for testing.

**Solution:** Pre-configured default values:
- 4 agents with defined names and personalities (Carlos, Maria, Pedro, Laura)
- 2x2 design already created (civil_pro, civil_against, incivil_pro, incivil_against)
- Pre-configured LLMs (Anthropic Director, HuggingFace Performer/Moderator)
- Pre-filled chatroom context

---

### 3. Uncensored Model for Uncivil Content

**Problem:** Models like Claude may refuse to generate very aggressive content.

**Solution:** Configured `dphn/Dolphin-Mistral-24B-Venice-Edition` as default Performer (uncensored model via HuggingFace/Featherless AI).

---

### 4. HuggingFace Token Not Loaded

**Problem:** Error "Cannot select auto-router when using non-Hugging Face API key"

**Cause:** Docker container did not reload environment variables with `docker compose restart`.

**Solution:** Use `docker compose up -d --force-recreate app` to force `.env` reload.

---

## Recommended LLM Configuration

| Role | Provider | Model | Reason |
|------|----------|-------|--------|
| Director | Anthropic | claude-sonnet-4-20250514 | Good at reasoning and deciding |
| Performer | HuggingFace | Dolphin-Mistral-24B:featherless-ai | Uncensored |
| Moderator | HuggingFace | Llama-3.1-8B-Instruct | Fast and cheap |

---

## Useful Commands

```bash
# Rebuild and launch
docker compose up -d --build

# View backend logs
docker compose logs app --tail=100

# Restart with new environment variables
docker compose up -d --force-recreate app
```
