const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
    const response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
      contents: `Classify this support ticket. Respond ONLY with JSON, no markdown, no preamble:
{"category": "<short category>", "priority": "Low|Medium|High", "summary": "<one sentence summary>"}

Subject: ${subject}
Description: ${description}`
    });

    const text = response.text.trim();
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

const generateReply = async (ticket, conversation, customerMessage) => {
  try {
    const history = conversation
      .map((m) => `${m.senderRole === 'customer' ? 'Customer' : 'Agent'}: ${m.text}`)
      .join('\n');

    const prompt = `You are a helpful, professional customer support agent replying inside a support ticket.

Ticket subject: ${ticket.subject}
Ticket description: ${ticket.description}
Category: ${ticket.category}
Priority: ${ticket.priority}

Conversation so far:
${history || '(no earlier messages)'}

Customer just said: "${customerMessage}"

Write a short, helpful, friendly reply (2-4 sentences) as the support agent. Respond with plain text only — no JSON, no markdown, no preamble.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt
    });

    const text = response.text.trim();

    if (!text) throw new Error('Empty AI reply');
    return { success: true, text };
  } catch (err) {
    console.error('AI reply generation failed:', err.message);
    return {
      success: false,
      text: "Thanks for your message — a support agent will get back to you shortly."
    };
  }
};

module.exports = { triageTicket, generateReply };