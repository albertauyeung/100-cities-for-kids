import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import App, { SITE_BASENAME } from './App.tsx'

export function render(pathname: string): string {
  const location = pathname.startsWith(SITE_BASENAME)
    ? pathname
    : SITE_BASENAME + (pathname.startsWith('/') ? pathname : '/' + pathname)
  return renderToString(
    <StrictMode>
      <StaticRouter location={location} basename={SITE_BASENAME}>
        <App />
      </StaticRouter>
    </StrictMode>
  )
}
