import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppRoutes from './routes';
import { ToastProvider, toast } from './components/ui/ToastProvider';

const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onSuccess: (data) => {
      if (data?.success === true) {
        toast.success(data.message || 'Changes saved successfully.');
      }
    },
    onError: (error) => {
      toast.error(error?.message || 'The requested change could not be saved.');
    },
  }),
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </React.StrictMode>
  );
}
