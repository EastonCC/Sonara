import React from 'react'
import ReactDOM from 'react-dom/client'
import Home from './home.tsx'
import './index.css' // If you have a CSS file, keep this. If not, remove it.

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Home />
  </React.StrictMode>,
)
