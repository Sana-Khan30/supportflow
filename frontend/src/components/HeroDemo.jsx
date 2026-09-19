import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = [
  {
    key: "customer",
    label: "Customer",
    text: "My payment failed twice, I got charged both times.",
    tag: null,
  },
  {
    key: "ai",
    label: "AI triage",
    text: "Reading the message, checking urgency…",
    tag: { text: "High priority · Billing", color: "bg-signal-coral text-white" },
  },
  {
    key: "agent",
    label: "Agent",
    text: "Hi! I can see the duplicate charge — refunding it now.",
    tag: { text: "Resolved in 4m", color: "bg-ink-700 text-paper" },
  },
];

const HeroDemo = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setStep((s) => (s + 1) % STEPS.length), 2600);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="w-full max-w-sm bg-ink-900 rounded-xl border border-ink-700 shadow-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-ink-700">
        <span className="w-2.5 h-2.5 rounded-full bg-ink-600" />
        <span className="w-2.5 h-2.5 rounded-full bg-ink-600" />
        <span className="w-2.5 h-2.5 rounded-full bg-ink-600" />
        <span className="ml-2 font-mono text-[11px] text-ink-400">#TCK-0412 — live</span>
      </div>

      <div className="p-5 min-h-[190px] flex flex-col justify-center gap-3">
        {STEPS.map((s, i) => (
          <motion.div
            key={s.key}
            initial={false}
            animate={{
              opacity: i <= step ? 1 : 0.15,
              x: 0,
            }}
            transition={{ duration: 0.4 }}
            className={`flex ${s.key === "customer" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3.5 py-2.5 text-sm ${
                s.key === "customer"
                  ? "bg-paper text-ink-900"
                  : s.key === "ai"
                  ? "bg-signal-coral/10 text-paper border border-signal-coral/30"
                  : "bg-ink-700 text-paper"
              }`}
            >
              <p className="text-[10px] opacity-60 mb-0.5">{s.label}</p>
              <p>{s.text}</p>
            </div>
          </motion.div>
        ))}

        <div className="h-6">
          <AnimatePresence mode="wait">
            {STEPS[step].tag && (
              <motion.span
                key={STEPS[step].key}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`inline-block text-[11px] font-mono px-2 py-1 rounded ${STEPS[step].tag.color}`}
              >
                {STEPS[step].tag.text}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default HeroDemo;