# Design Language & Typography

## 4. Design System

All tokens are CSS custom properties in `src/styles.css`, exposed to Tailwind via `@theme inline`. **Never hardcode colors** (`text-white`, `bg-[#fff]`) in components — always semantic tokens.
