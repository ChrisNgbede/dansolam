import React from 'react';
import { useLocation } from 'react-router-dom';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Page render failed', error, info);
  }

  componentDidUpdate(previousProps) {
    if (this.state.error && previousProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="min-h-screen bg-white dark:bg-[#17101F] px-5 py-20 grid place-items-center text-center">
        <section className="w-full max-w-lg rounded-[28px] border border-[#EADBEE] dark:border-white/10 bg-white dark:bg-[#1E1528] p-8 sm:p-10 shadow-xl">
          <span className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-[#EC268F]/10 text-[#EC268F]">
            <AlertTriangle className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="text-xl font-extrabold text-[#221B2B] dark:text-white">This page hit an unexpected problem</h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-[#C9BED4]">
            Your information is safe. Reload this page, or return home and continue browsing.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
            <button type="button" onClick={() => window.location.reload()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#5D3E85] px-6 text-xs font-bold text-white hover:bg-[#EC268F]">
              <RefreshCw className="h-4 w-4" aria-hidden="true" /> Reload Page
            </button>
            <a href="/" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#EADBEE] px-6 text-xs font-bold text-[#221B2B] dark:text-white">
              <Home className="h-4 w-4" aria-hidden="true" /> Return Home
            </a>
          </div>
        </section>
      </main>
    );
  }
}

export default function AppErrorBoundary({ children }) {
  const location = useLocation();
  return <ErrorBoundary resetKey={`${location.pathname}${location.search}`}>{children}</ErrorBoundary>;
}
