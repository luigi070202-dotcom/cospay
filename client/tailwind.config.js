/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#6366F1",    // Anime Twilight Indigo (Main buttons, active links)
          hover: "#4F46E5",      // Deeper Indigo for button hovers
          peso: "#06B6D4",       // Vivid Cyan (GCash, ₱ symbol, secure badge)
          accent: "#F43F5E",     // Sunset Rose (Special tags, flaw alerts)
          canvas: "#F8FAFC",     // Washi Sky background (clean light canvas)
          card: "#FFFFFF",       // Pure white for cards & modals
          text: "#0F172A",       // Deep night text
          muted: "#64748B",      // Cool slate for subtitles and dates
        },
        status: {
          verified: "#06B6D4",   // Cyan verified badge
          pending: "#F59E0B",    // Amber pending badge
          dispute: "#F43F5E",    // Sunset rose warning
        },
      },
    },
  },
  plugins: [],
}