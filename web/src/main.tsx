import { StrictMode } from 'react'
import { hydrateRoot, createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App, { SITE_BASENAME } from './App.tsx'

const container = document.getElementById('root')!
const tree = (
  <StrictMode>
    <BrowserRouter basename={SITE_BASENAME}>
      <App />
    </BrowserRouter>
  </StrictMode>
)

if (container.firstElementChild) {
  hydrateRoot(container, tree)
} else {
  createRoot(container).render(tree)
}
