import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './fonts/cairo.css'
import './fonts/baloo.css'
import './fonts/brand.css'
import './theme.css'
import './showtime.css'
import './skins/neo.css'
import './skins/blocks.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
