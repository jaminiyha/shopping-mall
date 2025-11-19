import { BrowserRouter, Routes, Route } from "react-router-dom"
import { ToastProvider } from "@/context/toast-context"
import { AuthProvider } from "@/context/AuthContext"
import { CartProvider } from "@/context/CartContext"
import { Toaster } from "@/components/ui/toaster"
import Navbar from "@/components/Navbar"
import SignUp from "@/pages/SignUp"
import Login from "@/pages/Login"
import Home from "@/pages/Home"
import Products from "@/pages/Products"
import ProductDetail from "@/pages/ProductDetail"
import Cart from "@/pages/Cart"
import Checkout from "@/pages/Checkout"

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/login" element={<Login />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
            </Routes>
            <Toaster />
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  )
}

export default App
