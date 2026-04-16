"use client";

import { Component, ErrorInfo, ReactNode } from "react";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[ErrorBoundary]", error, info);
  }

  handleRefresh = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center justify-center px-4 py-10">
          <div className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 p-8 text-center">
            <h2 className="text-2xl font-semibold text-white">Something went wrong</h2>
            <p className="mt-2 text-slate-300">Try refreshing the page</p>
            <button
              type="button"
              onClick={this.handleRefresh}
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-amber-500 px-4 text-sm font-semibold text-black transition hover:bg-amber-400"
            >
              Refresh
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
