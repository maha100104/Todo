import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// ── Theme initialization (runs before React paints) ──────────────────────────
// Read saved theme from localStorage and apply class BEFORE first render
// to avoid a flash of wrong theme on page load / refresh.
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
  document.documentElement.classList.add('light-theme');
} else {
  // Default to dark — remove any leftover class
  document.documentElement.classList.remove('light-theme');
  localStorage.setItem('theme', 'dark');
}
// ─────────────────────────────────────────────────────────────────────────────

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
