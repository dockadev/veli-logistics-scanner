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
import { LanguageProvider } from './components/LanguageProvider'
import { blockDevTools } from './lib/devtools'

// Geliştirici araçları kullanıcıya açık değil. WebView2'de F12 ve
// Ctrl+Shift+I varsayılan olarak çalışır; Rust tarafı bunu kapatamaz,
// çünkü pencere oluşturulduktan sonra devre dışı bırakılamaz.
blockDevTools()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>,
)