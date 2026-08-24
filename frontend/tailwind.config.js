export default {
    content: ["./index.html", "./src/**/*.{js,jsx}"],
    theme: {
      extend: {
        colors: {
          bg: "#0B0D0F",
          surface: "#16191D",
          border: "#2A2F36",
          muted: "#8A919C",
          text: "#F5F6F7",
          alert: "#FF6B1A",
          warn: "#E8B339",
          safe: "#3DA35D",
        },
        fontFamily: {
          mono: ["JetBrains Mono", "monospace"],
          sans: ["Inter", "sans-serif"],
        },
      },
    },
    plugins: [],
  };