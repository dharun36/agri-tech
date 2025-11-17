import './i18n'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fortawesome/fontawesome-free/css/all.min.css';
import './index.css'
import './styles/layout.css'
import './styles/pageTitles.css'
import App from './App.jsx'
import { ThemeProvider } from './contexts/ThemeContext'
import { LingoProviderWrapper, loadDictionary as lingoLoadDictionary } from 'lingo.dev/react/client'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LingoProviderWrapper loadDictionary={(locale) => lingoLoadDictionary(locale)}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </LingoProviderWrapper>
  </StrictMode>,
)
