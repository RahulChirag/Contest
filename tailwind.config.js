/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      height: {
        14: "3.5rem", // Add custom height
      },
      colors: {
        "custom-gray": "#f9f9f9",
        "custom-button-yellow": "#ECA82C",
        "custom-button-blue": "#1A2164",
        "custom-header-blue": "#2F3994",
        "custom-bg-blue": "#1A2164",
      },
    },
  },
  plugins: [],
};
