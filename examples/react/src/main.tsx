import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@anil-labs/google-places-autocomplete-core/styles.css'
import { App } from './App'

const root = document.getElementById('app')
if (!root) throw new Error('Missing #app root element')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
