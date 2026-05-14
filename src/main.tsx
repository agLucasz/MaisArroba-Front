import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './Styles/index.css'
import AppRoutes from './Routes/AppRoutes'
import { CartProvider } from './Contexts/CartContext'
import { CompradorProvider } from './Contexts/CompradorContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <CompradorProvider>
        <CartProvider>
          <AppRoutes />
        </CartProvider>
      </CompradorProvider>
    </BrowserRouter>
  </StrictMode>,
)
  