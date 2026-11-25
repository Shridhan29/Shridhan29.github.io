import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { startAnalytics } from './analytics'
import './styles/index.css'

// 5.7: a note for whoever opens the console — likely someone hiring, or curious.
console.info(
  '%c shridhan. %c\n\nYou opened the console, so you read source.\nThis site is open: https://github.com/Shridhan29/Shridhan29.github.io\nAdd ?debug=1 to the URL for the renderer stats, or ?tier=low|medium|high to force a quality tier.\n',
  'background:#e8eaf0;color:#05060a;font:600 13px ui-monospace,monospace;padding:4px 6px;border-radius:3px',
  'color:#8b93a7;font:12px ui-monospace,monospace',
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

startAnalytics()
