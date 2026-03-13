import type { ExperimentalConfig, TreatmentGroup } from "./admin-types"

export const CHATROOM_CONTEXT_3X3 = `This is a Spanish-language chatroom on Telegram, based in Spain. Messages must be written in Spanish.
The participant has posted an opinion about a news article.
The Director must preserve the assigned treatment condition across the whole conversation.

Important design rule:
- Agents must remain ideologically consistent across the whole conversation.
- A like-minded agent should consistently support the participant.
- A not-like-minded agent should consistently oppose the participant.
- Do not switch an agent from support to opposition or from opposition to support.
- Treatment percentages refer to the share of total group messages across the conversation, not to changing agent beliefs.
- The Director should satisfy the treatment by choosing which consistent agents speak more or less often.
- Prefer stable speaking frequency per agent unless adjustment is needed to satisfy the treatment.
- Avoid abrupt over-correction in turn allocation.
- Keep the flow natural; do not force strict alternation.`

function buildTreatment(uncivilPct: 20 | 50 | 80, likeMindedPct: 20 | 50 | 80): string {
  const notLikeMindedPct = 100 - likeMindedPct
  const civilPct = 100 - uncivilPct

  const uncivilPer10 = uncivilPct / 10
  const civilPer10 = civilPct / 10
  const likePer10 = likeMindedPct / 10
  const notLikePer10 = notLikeMindedPct / 10

  const styleLine = uncivilPct === 80
    ? "- Messages should remain short and sharp."
    : "- Messages should remain short and natural."

  const uncivilLine = uncivilPct === 80
    ? "- Uncivility means strong rudeness, repeated sarcasm, mockery, and harsh dismissiveness only."
    : "- Uncivility means rudeness, sarcasm, mockery, or dismissive tone only."

  return `Maintain about ${uncivilPct}% uncivil messages across the conversation.
Maintain about ${likeMindedPct}% like-minded messages and about ${notLikeMindedPct}% not-like-minded messages across the conversation.

Agent consistency:
- Agents must keep a stable position.
- Like-minded agents consistently support the participant.
- Not-like-minded agents consistently oppose the participant.
- The Director must meet the target by selecting who speaks more often, not by changing anyone's stance.
- Prefer approximately stable speaking frequency per agent unless adjustment is needed to satisfy the target percentages.
- Use mild, gradual turn-allocation corrections rather than abrupt swings.

Operational rule of thumb per 10 group messages:
- about ${uncivilPer10} uncivil, about ${civilPer10} civil;
- about ${likePer10} like-minded, about ${notLikePer10} not-like-minded.

Windowing rule:
- Stay close to the target not only overall, but also within any window of about 10 consecutive group messages.

Independence rule:
- Alignment and incivility are independent dimensions.
- A supportive message can be civil or uncivil.
- An opposing message can be civil or uncivil.

Style:
${styleLine}
${uncivilLine}
- No slurs, no dehumanization, no threats, no incitement to violence.`
}

const DESIGN_3X3: Array<{ key: string; uncivil: 20 | 50 | 80; like: 20 | 50 | 80 }> = [
  { key: "low_against", uncivil: 20, like: 20 },
  { key: "low_mixed", uncivil: 20, like: 50 },
  { key: "low_favor", uncivil: 20, like: 80 },
  { key: "medium_against", uncivil: 50, like: 20 },
  { key: "medium_mixed", uncivil: 50, like: 50 },
  { key: "medium_favor", uncivil: 50, like: 80 },
  { key: "high_against", uncivil: 80, like: 20 },
  { key: "high_mixed", uncivil: 80, like: 50 },
  { key: "high_favor", uncivil: 80, like: 80 },
]

export function createExperimental3x3Preset(): ExperimentalConfig {
  const groups: Record<string, TreatmentGroup> = {}
  for (const row of DESIGN_3X3) {
    groups[row.key] = {
      features: [],
      treatment: buildTreatment(row.uncivil, row.like),
    }
  }

  return {
    chatroom_context: CHATROOM_CONTEXT_3X3,
    redirect_url: "",
    groups,
  }
}
