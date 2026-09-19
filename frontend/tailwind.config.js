export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#15141A",
          50: "#F7F6F4",
          100: "#EAE8E5",
          200: "#D4D1CC",
          300: "#AFACA8",
          400: "#87848D",
          500: "#63616B",
          600: "#48454E",
          700: "#302E35",
          800: "#1E1C22",
          900: "#15141A",
        },
        paper: {
          DEFAULT: "#F7F5F1",
          dim: "#ECE9E2",
        },
        // signal.coral is the site's one bold accent (marketing pages, CTAs,
        // the auth "busy" indicator). amber/teal are kept muted and used only
        // for internal priority/status badges (PriorityBadge, StatusBadge),
        // not as decorative color on marketing surfaces.
        signal: {
          amber: "#A8792B",
          "amber-dim": "#F1E4CE",
          coral: "#FF4319",
          "coral-dim": "#FFE1D8",
          teal: "#3D7D64",
          "teal-dim": "#DEEBE5",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        sans: ["'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      boxShadow: {
        stub: "2px 2px 0 0 rgba(23,27,33,0.08)",
      },
    },
  },
  plugins: [],
}