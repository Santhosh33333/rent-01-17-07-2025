import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import { RoleProvider } from './lib/roleContext'
import { App } from './App'
import './styles/globals.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <RoleProvider>
          <App />
        </RoleProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)