import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Cars from './pages/Cars';
import Clients from './pages/Clients';
import Rentals from './pages/Rentals';
import RentalDetail from './pages/RentalDetail';
import Reports from './pages/Reports';
import Users from './pages/Users';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  return token ? <Layout>{children}</Layout> : <Navigate to="/login" />;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!token) return <Navigate to="/login" />;
  if (user.role !== 'admin') return <Navigate to="/" />;
  return <Layout>{children}</Layout>;
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/cars" element={<PrivateRoute><Cars /></PrivateRoute>} />
        <Route path="/clients" element={<PrivateRoute><Clients /></PrivateRoute>} />
        <Route path="/rentals" element={<PrivateRoute><Rentals /></PrivateRoute>} />
        <Route path="/rentals/:id" element={<PrivateRoute><RentalDetail /></PrivateRoute>} />
        <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
        
        <Route path="/users" element={<AdminRoute><Users /></AdminRoute>} />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
