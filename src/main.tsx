import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Fontlar: website ile aynı üçlü (Outfit gövde, Oxanium rakam, JetBrains Mono kod).
import '@fontsource/outfit/400.css'
import '@fontsource/outfit/600.css'
import '@fontsource/outfit/700.css'
import '@fontsource/oxanium/600.css'
import '@fontsource/oxanium/700.css'
import '@fontsource-variable/jetbrains-mono'

import './styles.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)