import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { Inbox, Sparkles, MessageCircle, Star, Zap, ListOrdered, CalendarCheck } from "lucide-react";
import Button from "../components/ui/Button";
import Logo from "../components/ui/Logo";
import HeroDemo from "../components/HeroDemo";

const STEPS = [
  {
    icon: Inbox,
    title: "A ticket comes in",
    body: "A customer describes their issue in plain language — no forms to fill out first.",
  },
  {
    icon: Sparkles,
    title: "AI triages it instantly",
    body: "Category, priority, and a one-line summary are attached before an agent ever opens it.",
  },
  {
    icon: MessageCircle,
    title: "An agent replies from the queue",
    body: "The most urgent tickets sit at the top, so nothing important waits behind something small.",
  },
  {
    icon: Star,
    title: "The customer rates the fix",
    body: "Once it's resolved, a quick rating closes the loop and feeds your team's track record.",
  },
];

const FEATURES = [
  {
    icon: Zap,
    title: "AI triage on arrival",
    body: "Every new ticket is read, categorized, and prioritized the moment it lands — before an agent even opens it.",
  },
  {
    icon: ListOrdered,
    title: "One queue, no guessing",
    body: "Agents see what's urgent first. Customers see exactly where their ticket stands, always.",
  },
  {
    icon: CalendarCheck,
    title: "Booking & resolution tracking",
    body: "Turn a ticket into a scheduled session with an agent, and close the loop with a review.",
  },
];

// One choreographed entrance for the hero column — not per-element scatter.
const heroContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.08 } },
};
const heroItem = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};

const FlowLine = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <div ref={ref} className="hidden lg:block absolute top-9 left-[12.5%] right-[12.5%] h-px overflow-hidden">
      <motion.div
        initial={{ scaleX: 0 }}
        animate={inView ? { scaleX: 1 } : {}}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformOrigin: "left" }}
        className="flow-line w-full h-full"
      />
    </div>
  );
};

const Landing = () => {
  return (
    <div className="min-h-screen bg-paper">
      {/* Light band: nav + hero — matches the dashboard's own paper/white palette */}
      <div className="relative bg-paper border-b border-ink-100 overflow-hidden">
        {/* Faint console grid texture — restrained, purely atmospheric */}
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, #0A0A0B 1px, transparent 1px), linear-gradient(to bottom, #0A0A0B 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        {/* Single ambient glow anchoring the live-demo panel */}
        <div className="absolute -right-24 top-24 w-[520px] h-[520px] bg-signal-coral/10 rounded-full blur-[120px] pointer-events-none" />

        <nav className="relative flex items-center justify-between px-6 sm:px-8 py-5 max-w-6xl mx-auto">
          <Logo />
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-ink-500 hover:text-ink-900 transition-colors">
              Log in
            </Link>
            <Link to="/register">
              <Button variant="accent" size="sm">Get started</Button>
            </Link>
          </div>
        </nav>

        <header className="relative max-w-6xl mx-auto px-6 sm:px-8 pt-10 pb-24 grid lg:grid-cols-2 gap-14 items-center">
          <motion.div variants={heroContainer} initial="hidden" animate="show">
            <motion.p variants={heroItem} className="font-mono text-xs text-ink-400 mb-4">
              a support desk that reads its own mail
            </motion.p>
            <motion.h1
              variants={heroItem}
              className="font-display text-4xl sm:text-5xl font-bold text-ink-900 leading-tight mb-5"
            >
              Support tickets that route themselves.
            </motion.h1>
            <motion.p variants={heroItem} className="text-lg text-ink-500 mb-8 max-w-md">
              SupportFlow reads every incoming ticket, works out what it is and how urgent it is,
              and hands your team a queue that's already sorted. Watch it happen on the right.
            </motion.p>
            <motion.div variants={heroItem} className="flex flex-wrap items-center gap-3 mb-6">
              <Link to="/register">
                <Button variant="accent" size="lg">Create an account</Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg">Log in</Button>
              </Link>
            </motion.div>
            <motion.p variants={heroItem} className="text-sm text-ink-400">
              Nothing to set up first —{" "}
              <Link to="/login" className="text-ink-700 underline underline-offset-2 hover:text-ink-900 transition-colors">
                try it instantly as a customer or an agent
              </Link>
              .
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex justify-center lg:justify-end"
          >
            <HeroDemo />
          </motion.div>
        </header>
      </div>

      {/* How it works — the sequence this product actually follows */}
      <section className="max-w-6xl mx-auto px-6 sm:px-8 py-20">
        <h2 className="font-display text-2xl font-bold text-ink-900 mb-2">How a ticket moves through SupportFlow</h2>
        <p className="text-ink-500 mb-12 max-w-lg">Four steps, start to finish — the same path every ticket takes.</p>

        <div className="relative grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Connecting line, desktop only — draws itself in once scrolled into view */}
          <FlowLine />

          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="relative bg-white border border-ink-100 rounded-lg p-5">
                <div className="w-9 h-9 rounded-full bg-ink-900 text-paper flex items-center justify-center mb-4 relative z-10">
                  <Icon size={16} />
                </div>
                <p className="font-mono text-[11px] text-ink-400 mb-1">Step {i + 1}</p>
                <h3 className="font-display font-semibold text-ink-900 mb-1.5">{step.title}</h3>
                <p className="text-sm text-ink-500 leading-relaxed">{step.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Feature summary — styled as console readouts to match the dispatch motif */}
      <section className="bg-paper-dim">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 py-20 grid sm:grid-cols-3 gap-8">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title}>
                <div className="w-9 h-9 rounded-md border border-ink-200 bg-white flex items-center justify-center mb-4">
                  <Icon size={16} className="text-ink-700" />
                </div>
                <h3 className="font-display font-semibold text-ink-900 mb-2">{f.title}</h3>
                <p className="text-sm text-ink-500 leading-relaxed">{f.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="bg-white border-t border-ink-100">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Logo size="sm" />
          <p className="text-sm text-ink-500">SupportFlow — built for teams who don't want to triage manually.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;