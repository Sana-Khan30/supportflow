import { motion } from 'framer-motion';
import Logo from './ui/Logo';
import HeroDemo from './HeroDemo';

/**
 * Calm, minimal auth shell — 2026 SaaS login patterns favor reduced visual
 * noise and generous whitespace over decorative chrome, so the console
 * "session bar" from the earlier version is kept but quieted down to a
 * single small line, not a competing UI element. The split-screen layout
 * (form + live preview) stays: it's a well-established, low-friction
 * pattern when the preview earns its place, which the live triage demo does
 * here — it's the same story the landing page's hero just told.
 *
 * Spacing is kept tight enough that the card fits a normal viewport on its
 * own — no forced height caps or inner scroll containers, which just trade
 * one scrollbar for another. Natural page flow only.
 */
const AuthLayout = ({ title, subtitle, children, statusLabel = 'connecting', busy = false }) => {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-4xl bg-white border border-ink-100 rounded-xl shadow-lg overflow-hidden"
      >
        <div className="grid lg:grid-cols-2">
          {/* Form panel */}
          <div className="px-7 py-8 sm:px-10 sm:py-9">
            <Logo />

            <div className="mt-6 mb-6">
              <h1 className="font-display text-2xl font-bold text-ink-900 mb-1.5">{title}</h1>
              <p className="text-sm text-ink-500">{subtitle}</p>
            </div>

            {children}

            <div className="mt-6 pt-4 border-t border-ink-50 flex items-center gap-1.5 font-mono text-[11px] text-ink-300">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  busy ? 'bg-signal-coral status-dot-active' : 'bg-ink-200'
                }`}
              />
              {busy ? statusLabel : 'supportflow session ready'}
            </div>
          </div>

          {/* Live preview panel — same animated triage loop as the homepage hero */}
          <div className="hidden lg:flex items-center justify-center bg-paper-dim border-l border-ink-100 p-6">
            <HeroDemo />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthLayout;