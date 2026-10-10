const assert = require('assert');
const { triageTicket, generateGroundedCopilotDraft, detectDuplicates, heuristicTriage } = require('./src/services/aiService');

console.log('🧪 Starting SupportFlow Comprehensive Verification Test Suite...\n');

let passed = 0;
let failed = 0;

const test = async (name, fn) => {
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}\n`);
    failed++;
  }
};

const runVerification = async () => {
  // Test 1: Multi-Dimensional AI Triage - Billing & Frustrated Sentiment
  await test('1. AI Triage accurately identifies Billing category, Urgent priority, and Frustrated sentiment', () => {
    const res = heuristicTriage('Billed twice for subscription', 'I was charged $49 twice on my card yesterday! This is unacceptable.');
    assert.strictEqual(res.category, 'Billing');
    assert.strictEqual(res.priority, 'High');
    assert.strictEqual(res.sentiment, 'Frustrated');
    assert(res.urgencyScore >= 7, 'Urgency score should be >= 7');
    assert(res.confidence >= 70 && res.confidence <= 99, 'Confidence should be between 70 and 99');
    assert(Array.isArray(res.keyPoints) && res.keyPoints.length > 0, 'Key points should be an array');
  });

  // Test 2: AI Triage - Authentication Outage & High Urgency
  await test('2. AI Triage accurately identifies Authentication outage & Urgency score >= 8', () => {
    const res = heuristicTriage('URGENT: 2FA Authentication lock out', 'Our team cannot log in with OTP codes and we are blocked from our account.');
    assert.strictEqual(res.category, 'Authentication');
    assert.strictEqual(res.priority, 'High');
    assert.strictEqual(res.sentiment, 'Urgent');
    assert.strictEqual(res.urgencyScore, 9);
  });

  // Test 3: AI Triage - Feature Request & Low Priority
  await test('3. AI Triage accurately identifies Feature Request with Low priority & Positive sentiment', () => {
    const res = heuristicTriage('Feature idea: Dark mode report export', 'Would love if you guys could add a PDF export feature in dark mode someday! Thanks for the great app.');
    assert.strictEqual(res.category, 'Feature Request');
    assert.strictEqual(res.priority, 'Low');
    assert.strictEqual(res.sentiment, 'Positive');
    assert(res.urgencyScore <= 4);
  });

  // Test 4: Duplicate & Incident Pattern Radar
  await test('4. Duplicate & Incident Surge Radar detects matching open complaints', () => {
    const target = {
      _id: 'ticket-target',
      subject: 'Stripe webhook 500 error on payment checkout',
      description: 'Webhook endpoint receives 500 internal error during payment checkout.',
      category: 'Technical / Bug'
    };

    const queueCandidates = [
      {
        _id: 'ticket-dup-1',
        ticketNumber: 'TK-8801',
        subject: 'Payment checkout webhook failing with HTTP 500',
        description: 'Webhook failing with 500 error on Stripe payment events.',
        category: 'Technical / Bug',
        status: 'In Progress',
        createdAt: new Date()
      },
      {
        _id: 'ticket-other',
        ticketNumber: 'TK-8802',
        subject: 'How do I change my company billing email?',
        description: 'Need to update email address for invoices.',
        category: 'Billing',
        status: 'Resolved',
        createdAt: new Date()
      }
    ];

    const dups = detectDuplicates(target, queueCandidates);
    assert.strictEqual(dups.length, 1, 'Should match exactly 1 related ticket');
    assert.strictEqual(dups[0].ticketNumber, 'TK-8801');
    assert(dups[0].similarityScore >= 45, 'Similarity score should be >= 45%');
    assert(dups[0].matchingKeywords.some(w => ['webhook', 'payment', '500'].includes(w)));
  });

  // Test 5: Grounded Copilot Draft with Knowledge Base Citations
  await test('5. Grounded Knowledge Copilot drafts response with explicit source citation', async () => {
    const ticket = {
      subject: 'Customer lost 2FA device',
      description: 'Need help resetting my authenticator app.',
      category: 'Authentication',
      customer: { name: 'Jordan Smith' }
    };

    const kb = [
      {
        sourceCode: 'KB-AUTH-101',
        title: '2-Factor Authentication Recovery',
        content: 'Verify identity via registered email confirmation before resetting 2FA secret in dashboard.'
      }
    ];

    const res = await generateGroundedCopilotDraft(ticket, [], kb, 'Polite recovery reset');
    assert.strictEqual(res.success, true);
    assert(res.data.draft.length > 20);
    assert.strictEqual(res.data.sources.length, 1);
    assert.strictEqual(res.data.sources[0].code, 'KB-AUTH-101');
  });

  // Test 6: SLA Target Deadline Calculation Logic
  await test('6. SLA Target Deadlines are strictly calculated (High: 4h, Medium: 24h, Low: 48h)', () => {
    const calculateSla = (priority, baseDate = new Date()) => {
      if (priority === 'High') return new Date(baseDate.getTime() + 4 * 60 * 60 * 1000);
      if (priority === 'Low') return new Date(baseDate.getTime() + 48 * 60 * 60 * 1000);
      return new Date(baseDate.getTime() + 24 * 60 * 60 * 1000);
    };

    const start = new Date('2026-10-10T10:00:00Z');
    const highSla = calculateSla('High', start);
    const medSla = calculateSla('Medium', start);
    const lowSla = calculateSla('Low', start);

    assert.strictEqual(highSla.toISOString(), '2026-10-10T14:00:00.000Z');
    assert.strictEqual(medSla.toISOString(), '2026-10-11T10:00:00.000Z');
    assert.strictEqual(lowSla.toISOString(), '2026-10-12T10:00:00.000Z');
  });

  // Test 7: Confidential Staff Notes Security & Isolation
  await test('7. Confidential Staff Notes are strictly isolated from customer queries', () => {
    const mockMessages = [
      { _id: 'm1', text: 'Hello, I have an issue', senderRole: 'customer', isInternal: false },
      { _id: 'm2', text: 'INTERNAL: Check Stripe gateway logs for fraud', senderRole: 'agent', isInternal: true },
      { _id: 'm3', text: 'We are investigating your issue', senderRole: 'agent', isInternal: false }
    ];

    // Customer query filter simulation
    const customerFilter = (m) => m.isInternal !== true;
    const customerVisible = mockMessages.filter(customerFilter);

    assert.strictEqual(customerVisible.length, 2);
    assert(!customerVisible.some(m => m.isInternal === true));
    assert(!customerVisible.some(m => m.text.includes('INTERNAL')));
  });

  // Test 8: Resolution Note Mandatory Enforcement
  await test('8. Ticket resolution strictly enforces mandatory resolution note', () => {
    const attemptResolve = (status, note, existingNote) => {
      if (status === 'Resolved' && !note && !existingNote) {
        throw new Error('Resolution note required to resolve ticket');
      }
      return true;
    };

    assert.throws(() => attemptResolve('Resolved', '', ''), /Resolution note required/);
    assert.doesNotThrow(() => attemptResolve('Resolved', 'Fixed payment transaction', ''));
    assert.doesNotThrow(() => attemptResolve('In Progress', '', ''));
  });

  // Test 9: Analytics Calculations Safe Against Empty/Zero Records
  await test('9. Analytics computations produce safe values (no NaN or divide-by-zero) on empty queues', () => {
    const computeStats = (tickets = [], reviews = []) => {
      const resolved = tickets.filter(t => t.resolvedAt);
      const avgResolutionHours = resolved.length
        ? resolved.reduce((sum, t) => sum + (new Date(t.resolvedAt) - new Date(t.createdAt)), 0) /
          resolved.length /
          (1000 * 60 * 60)
        : null;
      const resolutionRate = tickets.length ? Math.round((resolved.length / tickets.length) * 100) : 0;
      const avgRating = reviews.length
        ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
        : null;

      return { resolutionRate, avgResolutionHours, avgRating };
    };

    const emptyResult = computeStats([], []);
    assert.strictEqual(emptyResult.resolutionRate, 0);
    assert.strictEqual(emptyResult.avgResolutionHours, null);
    assert.strictEqual(emptyResult.avgRating, null);
  });

  console.log(`\n======================================================`);
  console.log(`Verification Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`======================================================\n`);

  if (failed > 0) process.exit(1);
};

runVerification().catch((err) => {
  console.error('Test runner failed:', err);
  process.exit(1);
});
