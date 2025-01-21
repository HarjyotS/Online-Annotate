/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
  safelist: [
    "bg-blue-500",
    "bg-blue-600",
    "bg-green-500",
    "bg-green-600",
    "bg-red-500",
    "bg-red-600",
  ], // Add this line for dynamic classes
};
