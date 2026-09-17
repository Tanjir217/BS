import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Bayzid Shoes UI error:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="min-h-screen bg-white px-6 py-20 text-[#171717]">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/40">Bayzid Shoes</p>
          <h1 className="mt-4 text-3xl font-semibold">Something went wrong.</h1>
          <p className="mt-3 text-sm leading-6 text-black/55">The page hit an unexpected error. Reload once to restore the current application state.</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-7 rounded-md bg-black px-5 py-3 text-sm font-medium text-white">Reload page</button>
        </div>
      </main>
    );
  }
}

export default ErrorBoundary;
