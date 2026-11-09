import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import App from './App.jsx'
import ShaderBackground from './components/ShaderBackground.jsx'
import PixelParticles from './components/PixelParticles.jsx'
import { lockThePhone, installPWA } from './lib/phone.js'

lockThePhone()
installPWA()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ShaderBackground />
    <PixelParticles />
    <App />
  </StrictMode>,
)
