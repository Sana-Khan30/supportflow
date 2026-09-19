import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Logo from '../components/ui/Logo';
import Button from "../components/ui/Button";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

const Section = ({ eyebrow, title, children }) => (
  <motion.section
    initial="hidden"
    whileInView="show"
    viewport={{ once: true, margin: "-60px" }}
    variants={fadeUp}
    className="py-10 border-b border-ink-100 last:border-0"
  >
    <p className="text-xs font-mono text-signal-amber mb-2">{eyebrow}</p>
    <h2 className="font-display text-xl font-bold text-ink-900 mb-3">{title}</h2>
    <div className="text-ink-600 leading-relaxed space-y-3 max-w-2xl">{children}</div>
  </motion.section>
);

const STACK = [
  { group: "Frontend", items: "React, Vite, Tailwind CSS, Framer Motion, Recharts" },
  { group: "Backend", items: "Node.js, Express, MongoDB, Mongoose" },
  { group: "Real-time", items: "Socket.IO — live chat, notifications, ticket status" },
  { group: "AI", items: "Google Gemini — ticket triage & auto-reply" },
];

const About = () => (
  <div className="min-h-screen bg-paper">
    <nav className="flex items-center justify-between px-6 sm:px-8 py-5 max-w-3xl mx-auto">
      <Logo />
      <Link to="/" className="text-sm text-ink-500 hover:text-ink-900">← Back home</Link>
    </nav>

    <div className="max-w-2xl mx-auto px-6 sm:px-8 pb-24">
      <motion.div initial="hidden" animate="show" variants={fadeUp} className="pt-6 pb-4">
        <p className="text-xs font-mono text-ink-400 mb-2">CASE STUDY</p>
        <h1 className="font-display text-3xl font-bold text-ink-900 mb-3">
          Building SupportFlow: an AI-triaged support desk
        </h1>
        <p className="text-ink-500">
          A support ticketing platform that reads incoming tickets, prioritizes them automatically,
          and keeps customers and agents in sync in real time.
        </p>
      </motion.div>

      <Section eyebrow="THE PROBLEM" title="Support queues are sorted by arrival time, not urgency">
        <p>
          Most small-team support tools treat every new ticket the same — first in, first served.
          A billing failure and a "how do I change my password" question sit in the same queue,
          and agents lose time figuring out what's actually urgent before they can start helping.
        </p>
      </Section>

      <Section eyebrow="THE APPROACH" title="Let AI do the first pass, let humans do the judgment">
        <p>
          Every ticket is sent to Gemini on creation, which returns a category, a priority, and a
          one-line summary. The customer also gets an instant AI-drafted reply while they wait for
          a human — so the queue is never silent. Agents can edit anything the AI decided before
          acting on it; the model assists, it doesn't have the final say.
        </p>
      </Section>

      <Section eyebrow="ARCHITECTURE" title="Real-time by default">
        <p>
          Status changes, new messages, and notifications are pushed over Socket.IO rooms scoped
          per ticket and per user, instead of polling. An agent accepting a ticket, or an AI reply
          landing, shows up on the other side within a second — no refresh.
        </p>
      </Section>

      <Section eyebrow="STACK" title="What it's built with">
        <div className="grid sm:grid-cols-2 gap-3">
          {STACK.map((s) => (
            <div key={s.group} className="bg-white border border-ink-100 rounded-md p-4">
              <p className="text-xs font-mono text-ink-400 mb-1">{s.group}</p>
              <p className="text-sm text-ink-700">{s.items}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section eyebrow="WHAT I'D DO NEXT" title="Known limitations, stated plainly">
        <p>
          Booking status updates aren't wired to sockets yet — only tickets and chat are fully
          real-time. Analytics run as an in-memory aggregation rather than a proper reporting
          pipeline, which is fine at this scale but wouldn't hold up past a few thousand tickets.
          Both are on the roadmap.
        </p>
      </Section>

      <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="pt-8 flex gap-3">
        <Link to="/login"><Button size="lg">Try the live demo</Button></Link>
        <a href="https://github.com" target="_blank" rel="noreferrer">
          <Button size="lg" variant="outline">View source</Button>
        </a>
      </motion.div>
    </div>
  </div>
);

export default About;
