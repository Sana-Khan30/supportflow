const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ALLOWED_PRIORITIES = ['Low', 'Medium', 'High'];

const validateAIResult = (data) => {
  if (!data || typeof data !== 'object') return null;
  const { category, priority, summary } = data;
  if (
    typeof category !== 'string' || !category.trim() ||
    typeof summary !== 'string' || !summary.trim() ||
    !ALLOWED_PRIORITIES.includes(priority)
  ) {
    return null;
  }
  return { category: category.trim(), priority, summary: summary.trim() };
};

const triageTicket = async (subject, description) => {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Classify this support ticket. Respond ONLY with JSON, no markdown, no preamble:
{"category": "<short category>", "priority": "Low|Medium|High", "summary": "<one sentence summary>"}

Subject: ${subject}
Description: ${description}`
      }]
    });

    const text = response.content[0].text.trim();
    const cleaned = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    const validated = validateAIResult(parsed);

    if (!validated) throw new Error('Invalid AI response shape');
    return { success: true, data: validated };
  } catch (err) {
    console.error('AI triage failed:', err.message);
    return {
      success: false,
      data: { category: 'General', priority: 'Medium', summary: 'AI triage unavailable — manual review needed.' }
    };
  }
};

module.exports = { triageTicket };