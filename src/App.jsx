import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Home from './components/Home'
import AdminLogin from './components/AdminLogin'
import AdminDashboard from './components/AdminDashboard'

// simple route guard
const PrivateRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('adminPass');
  return isAuthenticated ? children : <Navigate to="/admin" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={
          <PrivateRoute>
            <AdminDashboard />
          </PrivateRoute>
        } />
      </Routes>
    </Router>
  )
}

export default App
