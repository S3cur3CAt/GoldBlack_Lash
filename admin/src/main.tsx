import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { DialogProvider } from './context/DialogContext'
import { UpdaterProvider } from './context/UpdaterContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DialogProvider>
      <UpdaterProvider>
        <App />
      </UpdaterProvider>
    </DialogProvider>
  </React.StrictMode>,
)

