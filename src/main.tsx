import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Use contextBridge
// This is a placeholder for any future IPC communication from the main process to the renderer process.
// window.clipboardAPI.onMainProcessMessage((_event, message) => {
//   console.log(message)
// })
