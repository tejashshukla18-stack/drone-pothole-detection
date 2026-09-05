import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import ToastViewport from './components/ui/Toast.jsx'

// On Render the UI is a Static Site and the API lives on a separate Web
// Service. Keep local development unchanged, but redirect all existing
// relative `/api/...` requests to the configured public backend.
const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, '')
if (apiUrl) {
  const nativeFetch = window.fetch.bind(window)
  window.fetch = (input, init) => {
    if (typeof input === 'string' && input.startsWith('/api/')) {
      return nativeFetch(`${apiUrl}${input}`, init)
    }
    return nativeFetch(input, init)
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <App />
        <ToastViewport />
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
)
