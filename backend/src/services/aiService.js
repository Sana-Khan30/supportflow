const { GoogleGenAI } = require('@google/genai');

const apiKey = process.env.GEMINI_API_KEY;
let ai = null;
if (apiKey && apiKey !== 'your-gemini-api-key' && apiKey.trim().length > 10) {
  try {
    ai = new GoogleGenAI({ apiKey });
  } catch (err) {
    console.warn('Gemini client init warning:', err.message);
  }
}

const ALLOWED_PRIORITIES = ['Low', 'Medium', 'High'];
const ALLOWED_SENTIMENTS = ['Frustrated', 'Neutral', 'Positive', 'Urgent'];

// Built-in intelligent heuristic triage fallback (ensures 100% reliability even if API key is not present)
const heuristicTriage = (subject, description) => {
  const combined = `${subject} ${description}`.toLowerCase();
  
  let category = 'General';
  let priority = 'Medium';
  let sentiment = 'Neutral';
  let intent = 'General Inquiry';
  let urgencyScore = 5;
  let confidence = 82;
  let suggestedAction = 'Review ticket and follow up with customer.';
  const keyPoints = [];

  // Categorization & Intent
  if (/refund|invoice|charge|bill|payment|pricing|card|charged|overcharge/i.test(combined)) {
    category = 'Billing';
    intent = 'Billing Inquiry / Dispute';
    suggestedAction = 'Check payment gateway logs and verify subscription status.';
    keyPoints.push('Involves financial transaction or billing query');
  } else if (/login|password|auth|2fa|otp|sign in|access|account|locked|blocked|session/i.test(combined)) {
    category = 'Authentication';
    intent = 'Account Access / Authentication Issue';
    suggestedAction = 'Verify account ownership and send security reset link.';
    keyPoints.push('User having difficulty authenticating or accessing account');
  } else if (/crash|error|bug|fail|broken|500|exception|timeout|not working|blank page/i.test(combined)) {
    category = 'Technical / Bug';
    intent = 'Software Error / Bug Report';
    suggestedAction = 'Inspect server error logs and reproduce reported steps.';
    keyPoints.push('Reported software malfunction or runtime failure');
  } else if (/slow|lag|latency|performance|downtime|outage|unresponsive/i.test(combined)) {
    category = 'Performance';
    intent = 'Performance / Outage Concern';
    suggestedAction = 'Check infrastructure health monitors and status dashboard.';
    keyPoints.push('User experiencing latency or service degradation');
  } else if (/feature|suggest|add|request|support for|wish/i.test(combined)) {
    category = 'Feature Request';
    intent = 'Feature Enhancement Request';
    suggestedAction = 'Log feedback for product roadmap consideration.';
    keyPoints.push('Enhancement or capability request');
  }

  // Sentiment & Urgency
  if (/urgent|critical|immediately|asap|disaster|emergency|down|data loss|blocked/i.test(combined)) {
    priority = 'High';
    sentiment = 'Urgent';
    urgencyScore = 9;
    confidence = 88;
  } else if (/angry|furious|terrible|horrible|unacceptable|cancel|money back|worst|lawyer/i.test(combined)) {
    priority = 'High';
    sentiment = 'Frustrated';
    urgencyScore = 8;
    confidence = 86;
  } else if (/thanks|thank you|great|awesome|love|appreciate/i.test(combined)) {
    sentiment = 'Positive';
    urgencyScore = 3;
    priority = 'Low';
  }

  if (subject.length > 5) keyPoints.push(`Subject: ${subject.slice(0, 60)}`);
  if (keyPoints.length < 2) keyPoints.push('Awaiting initial specialist response');

  const summary = `${subject.trim()}: ${description.trim().slice(0, 100)}${description.length > 100 ? '...' : ''}`;

  return {
    category,
    priority,
    sentiment,
    intent,
    urgencyScore,
    confidence,
    summary,
    suggestedAction,
    keyPoints
  };
};

const triageTicket = async (subject, description) => {
  if (!ai) {
    return {
      success: true,
      source: 'heuristic',
      data: heuristicTriage(subject, description)
    };
  }

  try {
    const prompt = `You are an elite customer support intelligence triage engine.
Analyze this support ticket and extract structured triage intelligence.
Respond ONLY with a valid JSON object (no markdown, no code fence, no text before or after).

Schema:
{
  "category": "Billing" | "Authentication" | "Technical / Bug" | "Performance" | "Feature Request" | "General",
  "priority": "Low" | "Medium" | "High",
  "sentiment": "Frustrated" | "Neutral" | "Positive" | "Urgent",
  "intent": "<Concise intent, max 6 words, e.g. 'Request refund for double charge'>",
  "urgencyScore": <integer 1 to 10>,
  "confidence": <integer 60 to 98>,
  "summary": "<1-2 sentence executive distillation of the core issue>",
  "suggestedAction": "<Specific operational recommendation for the support specialist>",
  "keyPoints": ["<key fact 1>", "<key fact 2>"]
}

Subject: ${subject}
Description: ${description}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    const text = response.text ? response.text.trim() : '';
    const cleaned = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    // Validate fields with defensive fallback defaults
    const category = parsed.category || 'General';
    const priority = ALLOWED_PRIORITIES.includes(parsed.priority) ? parsed.priority : 'Medium';
    const sentiment = ALLOWED_SENTIMENTS.includes(parsed.sentiment) ? parsed.sentiment : 'Neutral';
    const intent = parsed.intent || 'Customer Inquiry';
    const urgencyScore = typeof parsed.urgencyScore === 'number' ? Math.min(10, Math.max(1, parsed.urgencyScore)) : 5;
    const confidence = typeof parsed.confidence === 'number' ? Math.min(99, Math.max(50, parsed.confidence)) : 85;
    const summary = parsed.summary || subject;
    const suggestedAction = parsed.suggestedAction || 'Review ticket and follow up.';
    const keyPoints = Array.isArray(parsed.keyPoints) && parsed.keyPoints.length > 0 ? parsed.keyPoints.slice(0, 4) : [subject];

    return {
      success: true,
      source: 'gemini-2.5-flash',
      data: {
        category,
        priority,
        sentiment,
        intent,
        urgencyScore,
        confidence,
        summary,
        suggestedAction,
        keyPoints
      }
    };
  } catch (err) {
    console.warn('Gemini triage failed, falling back to heuristic:', err.message);
    return {
      success: true,
      source: 'heuristic-fallback',
      data: heuristicTriage(subject, description)
    };
  }
};

// Grounded Copilot response draft generator (Human-in-the-loop assistant)
const generateGroundedCopilotDraft = async (ticket, conversation = [], knowledgeArticles = [], agentInstruction = '') => {
  const historyText = conversation
    .filter((m) => !m.isInternal)
    .map((m) => `${m.senderRole === 'customer' ? 'Customer' : 'Agent'}: ${m.text}`)
    .join('\n');

  const kbContext = knowledgeArticles
    .map((k) => `[Source: ${k.sourceCode} - ${k.title}]\n${k.content}`)
    .join('\n\n');

  const fallbackDraft = () => {
    let base = `Hello ${ticket.customer?.name || 'there'},\n\nThank you for reaching out to SupportFlow. We have reviewed your inquiry regarding "${ticket.subject}".`;
    if (knowledgeArticles.length > 0) {
      base += `\n\nBased on our standard procedure (${knowledgeArticles[0].sourceCode}):\n${knowledgeArticles[0].content.slice(0, 180)}...`;
    }
    base += `\n\nPlease let us know if you have any additional details, and we will be happy to assist further.\n\nBest regards,\nSupportFlow Support Team`;
    return {
      draft: base,
      sources: knowledgeArticles.map(k => ({ code: k.sourceCode, title: k.title })),
      confidence: 85
    };
  };

  if (!ai) {
    return {
      success: true,
      source: 'grounded-heuristic',
      data: fallbackDraft()
    };
  }

  try {
    const prompt = `You are a professional support agent copilot.
Draft a high-quality, empathetic, and accurate response for a human agent to send to the customer.
CRITICAL SAFETY & GROUNDING RULES:
1. ONLY make commitments, refund promises, or technical statements that are directly backed by the APPROVED KNOWLEDGE BASE below.
2. If the knowledge base does not cover the request, acknowledge the issue and politely state that the specialist is actively investigating.
3. Include explicit citation markers like "[Source: KB-XXX Title]" when referencing policy or runbook steps.
4. Keep the tone helpful, clear, and professional.

TICKET DETAILS:
Subject: ${ticket.subject}
Description: ${ticket.description}
Category: ${ticket.category}
Sentiment: ${ticket.sentiment || 'Neutral'}

CONVERSATION HISTORY:
${historyText || '(No previous messages)'}

APPROVED KNOWLEDGE BASE & RUNBOOKS:
${kbContext || '(No matching knowledge base article found)'}

AGENT SPECIFIC INSTRUCTION (if any):
${agentInstruction || 'Standard helpful resolution draft'}

Respond with ONLY the response draft text for the agent to review and send.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    const text = response.text ? response.text.trim() : '';
    if (!text) throw new Error('Empty AI response');

    return {
      success: true,
      source: 'gemini-2.5-flash',
      data: {
        draft: text,
        sources: knowledgeArticles.map(k => ({ code: k.sourceCode, title: k.title })),
        confidence: 90
      }
    };
  } catch (err) {
    console.warn('Gemini draft generation failed, using grounded fallback:', err.message);
    return {
      success: true,
      source: 'grounded-fallback',
      data: fallbackDraft()
    };
  }
};

// Duplicate & Incident Pattern Detector
const detectDuplicates = (targetTicket, candidateTickets = []) => {
  const tokenize = (text) => {
    return (text || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 3);
  };

  const targetTokens = new Set([
    ...tokenize(targetTicket.subject),
    ...tokenize(targetTicket.description)
  ]);

  if (targetTokens.size === 0) return [];

  const results = [];

  for (const candidate of candidateTickets) {
    if (candidate._id.toString() === targetTicket._id.toString()) continue;

    const candTokens = new Set([
      ...tokenize(candidate.subject),
      ...tokenize(candidate.description)
    ]);

    if (candTokens.size === 0) continue;

    // Intersection over Union (Jaccard similarity)
    let common = 0;
    const matchingWords = [];
    for (const token of targetTokens) {
      if (candTokens.has(token)) {
        common++;
        matchingWords.push(token);
      }
    }

    const union = new Set([...targetTokens, ...candTokens]).size;
    const jaccard = union > 0 ? common / union : 0;
    
    // Category match bonus
    const catMatch = candidate.category && targetTicket.category && candidate.category === targetTicket.category;
    const weightedScore = Math.min(100, Math.round((jaccard * 0.75 + (catMatch ? 0.25 : 0)) * 100));

    if (weightedScore >= 25 || common >= 3) {
      results.push({
        ticketId: candidate._id,
        ticketNumber: candidate.ticketNumber,
        subject: candidate.subject,
        status: candidate.status,
        category: candidate.category,
        priority: candidate.priority,
        similarityScore: weightedScore,
        matchingKeywords: matchingWords.slice(0, 5),
        createdAt: candidate.createdAt
      });
    }
  }

  return results.sort((a, b) => b.similarityScore - a.similarityScore).slice(0, 5);
};

module.exports = {
  triageTicket,
  generateGroundedCopilotDraft,
  detectDuplicates,
  heuristicTriage
};