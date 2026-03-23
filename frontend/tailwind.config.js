/** @type {import('tailwindcss').Config} */
import sharedPreset from "./packages/ui-tokens/tailwind-preset.cjs"
import tailwindcssAnimate from "tailwindcss-animate"

export default {
  ...sharedPreset,
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./packages/ui-core/src/**/*.{js,ts,jsx,tsx}",
    "./packages/ui-shell/src/**/*.{js,ts,jsx,tsx}",
  ],
  plugins: [tailwindcssAnimate],
}
