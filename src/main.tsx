import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './fonts/cairo.css'
import './fonts/brand.css'
import './theme.css'
import './showtime.css'
import './skins/neo.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
