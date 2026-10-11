export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: { 950: "#071A3D", 900: "#0A2250", 800: "#0E2D66" },
        brand: { DEFAULT: "#1D4ED8", dark: "#1741B5", soft: "#E8EFFD" },
        canvas: "#F4F7FB",
        line: "#E3E9F2",
        ink: "#0F1B33",
        soft: "#6B7A90",
        danger: { DEFAULT: "#E5383B", soft: "#FDECEC" },
        warn: { DEFAULT: "#F59E0B", soft: "#FEF3DC" },
        orange: { DEFAULT: "#F77F00", soft: "#FFEFDD" },
        ok: { DEFAULT: "#16A34A", soft: "#E3F6EA" },
      },
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
      boxShadow: { card: "0 1px 2px rgba(15,27,51,0.04), 0 2px 8px rgba(15,27,51,0.04)" },
    },
  },
  plugins: [],
};
