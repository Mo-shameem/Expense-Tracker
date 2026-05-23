import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { consumeOAuthRedirect } from './lib/googleApi.js'

// Handle OAuth redirect before React mounts — stores token, cleans URL hash
consumeOAuthRedirect()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
