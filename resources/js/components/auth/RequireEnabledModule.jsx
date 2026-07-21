import React from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../hooks/useAuth';

export default function RequireEnabledModule({ settingKey, children }) {
  const {data,isLoading}=useQuery({queryKey:['settings-module-guard'],queryFn:()=>apiFetch('/api/admin/settings').then(r=>r.json())});
  if(isLoading) return <div className="h-64 rounded-xl bg-white border animate-pulse"/>;
  const value=data?.data?.settings?.[settingKey];
  return ['true','1',true,1].includes(value) ? children : <Navigate to="/admin/settings?tab=modules" replace/>;
}
