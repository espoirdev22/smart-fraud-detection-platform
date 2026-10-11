export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#111318",
        surface: "#1E2128",
        surfaceHover: "#262A33",
        border: "#30343D",
        muted: "#A0A7B4",
        text: "#F5F6F7",
        alert: "#FF6B1A",
        warn: "#E8B339",
        safe: "#3DA35D",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "monospace"],
        sans: ["Inter", "sans-serif"],
      },
      boxShadow: {
        card: "0 8px 24px rgba(0, 0, 0, 0.45)",
      },
    },
  },
  plugins: [],
};