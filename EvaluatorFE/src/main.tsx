import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import store, { persistor } from './store/index.ts'
import { PersistGate } from 'redux-persist/integration/react'
import { ToastContainer } from 'react-toastify'

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <BrowserRouter> 
          <App />
          <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      </BrowserRouter>
    </PersistGate>
  </Provider>
)
