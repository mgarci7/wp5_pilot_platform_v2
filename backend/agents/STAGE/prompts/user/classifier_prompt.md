# Classifier Task

## Agent Context

{AGENT_IDEOLOGY}
Directly addresses participant: {ADDRESSES_PARTICIPANT}

## Recent Chat Context (last messages before the agent message)

{RECENT_CONTEXT}

## Participant Messages

{PARTICIPANT_MESSAGES}

## Agent Message To Classify

{AGENT_MESSAGE}

## Response

Return ONLY this JSON object:

```json
{
  "is_incivil": true|false,
  "is_like_minded": null,
  "stance_confidence": null,
  "inferred_participant_stance": null,
  "rationale": "one short sentence"
}
```
