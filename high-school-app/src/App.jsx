import { BrowserRouter } from 'react-router-dom'
import { SchoolProvider } from './context/SchoolContext'
import AppRoutes from './routes/AppRoutes'

export default function App() {
  return (
    <SchoolProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </SchoolProvider>
  )
}
