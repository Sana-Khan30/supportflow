const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const result = await model.generateContent(
      `Classify this support ticket. Respond ONLY with JSON, no markdown, no preamble:
{"category": "<short category>", "priority": "Low|Medium|High", "summary": "<one sentence summary>"}

Subject: ${subject}
Description: ${description}`
    );

    const text = result.response.text().trim();
    const cleaned = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    const validated = validateAIResult(parsed);

    if (!validated) throw new Error('Invalid AI response shape');
    return { success: true, data: validated };
  } catch (err) {
    console.error('AI triage failed:', err.message);
    return {
      success: false,
      data: {
        category: 'General',
        priority: 'Medium',
        summary: 'AI triage unavailable — manual review needed.'
      }
    };
  }
};

module.exports = { triageTicket };