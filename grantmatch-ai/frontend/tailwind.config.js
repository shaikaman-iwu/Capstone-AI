export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#10261f",
        moss: "#1b5e4a",
        sand: "#f4efe6",
        ember: "#e27a52",
        pine: "#234438",
        paper: "#fffdf8",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Manrope", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      boxShadow: {
        glow: "0 24px 60px rgba(16, 38, 31, 0.12)",
      },
    },
  },
  plugins: [],
};
