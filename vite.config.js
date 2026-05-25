import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
    server: {
    port: 5173,
    allowedHosts:['eagle-endorphin-grimy.ngrok-free.dev','recap-backend-hqdahxf3hwg8fwbc.westeurope-01.azurewebsites.net']
  }
})
