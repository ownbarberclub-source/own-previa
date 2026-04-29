import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ErrorBoundary } from 'react-error-boundary'

function Fallback({ error }: { error: any }) {
  return (
    <div style={{ padding: 40, backgroundColor: '#7f1d1d', color: 'white', height: '100vh', boxSizing: 'border-box' }}>
      <h1>O Sistema Travou (Crash)</h1>
      <p>Um erro inesperado aconteceu na tela. Tire um print e envie para a equipe de tecnologia:</p>
      <pre style={{ backgroundColor: 'black', padding: 20, borderRadius: 8, whiteSpace: 'pre-wrap' }}>
        {error.message}
        <br/><br/>
        {error.stack}
      </pre>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary FallbackComponent={Fallback}>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
