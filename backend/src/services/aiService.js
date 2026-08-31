const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

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
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Classify this support ticket. Respond ONLY with JSON, no markdown, no preamble:
{"category": "<short category>", "priority": "Low|Medium|High", "summary": "<one sentence summary>"}

Subject: ${subject}
Description: ${description}`
          }]
        }],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API responded with status ${response.status}`);
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) throw new Error('Empty response from Gemini');

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