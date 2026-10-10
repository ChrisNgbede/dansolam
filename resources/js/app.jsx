import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppRoutes from './routes';
import { ToastProvider, toast } from './components/ui/ToastProvider';
import AppErrorBoundary from './components/ui/AppErrorBoundary';
import ImageSkeletons from './components/ui/ImageSkeletons';
import ActivityIndicator from './components/ui/ActivityIndicator';
import { restoreSharedSession } from './utils/sessionShare';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const rootElement = document.getElementById('root');
if (rootElement) {
  // Pick up a session-only login from another open tab before any route guard runs.
  restoreSharedSession().then(() => {
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AppErrorBoundary>
              <ToastProvider>
                <ImageSkeletons />
                <ActivityIndicator />
                <AppRoutes />
              </ToastProvider>
            </AppErrorBoundary>
          </BrowserRouter>
        </QueryClientProvider>
      </React.StrictMode>
    );
  });
}
