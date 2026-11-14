import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { installDemoFetch } from '@/demo/installDemoFetch'
import './index.css'
import App from './App.tsx'

installDemoFetch()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
