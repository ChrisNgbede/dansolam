import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export const getAdminToken = () => (
  localStorage.getItem('dansolam_admin_token')
  || sessionStorage.getItem('dansolam_admin_token')
  || localStorage.getItem('fairqueen_admin_token')
  || sessionStorage.getItem('fairqueen_admin_token')
);

export default function RequireAdminAuth({ children }) {
  const location = useLocation();

  if (!getAdminToken()) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
