"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  onReset: () => void;
}

interface State {
  hasError: boolean;
  message: string;
}

/**
 * A dedicated boundary around the graph canvas + stats panel. React Flow is
 * by far the most complex third-party piece of this app, so if something
 * there throws, this keeps the crash contained and lets the person recover
 * without losing the rest of the page shell - and critically, "reset" here
 * calls back into our own `handleReset` (which clears rawNodes/view state
 * directly) rather than relying solely on a route-level remount.
 */
export default class GraphErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : String(error),
    };
  }

  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error("[CDT] Graph view crashed:", error);
  }

  handleReset = () => {
    this.setState({ hasError: false, message: "" });
    this.props.onReset();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-ink-900 px-6 text-center gap-4">
          <p className="text-severity-critical text-sm font-medium">Graf gagal ditampilkan.</p>
          <p className="text-ink-500 text-xs max-w-sm leading-relaxed">
            Ada bagian dari kanvas graf yang gagal dirender. Data yang tersimpan di riwayat tetap
            aman - coba mulai simulasi baru.
          </p>
          <p className="text-ink-600 text-[10px] font-mono max-w-sm break-words">{this.state.message}</p>
          <button
            onClick={this.handleReset}
            className="rounded-md bg-signal-500 hover:bg-signal-400 text-ink-950 font-semibold px-4 py-2 text-sm transition-colors"
          >
            Mulai simulasi baru
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
