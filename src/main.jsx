import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Teclado (MAESTRO-2026-1234): Intro o espacio sobre una zona con role="button" que no es un <button>
// la pulsa, como haría un botón de verdad.
document.addEventListener('keydown', (e) => {
  const el = e.target
  if ((e.key === 'Enter' || e.key === ' ') && el instanceof HTMLElement
      && el.getAttribute('role') === 'button' && el.tagName !== 'BUTTON') {
    e.preventDefault()
    el.click()
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
