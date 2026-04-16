"use client";

import { Component, ErrorInfo, ReactNode } from "react";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    void error;
    void errorInfo;
  }

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto flex min-h-[50vh] w-full max-w-3xl flex-col items-center justify-center px-4 text-center">
          <h1 className="text-3xl font-semibold text-white">Something went wrong</h1>
          <p className="mt-2 text-slate-300">Try refreshing the page</p>
          <button
            type="button"
            onClick={this.handleRefresh}
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-amber-500 px-5 py-2.5 font-semibold text-black hover:bg-amber-400"
          >
            Refresh
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
