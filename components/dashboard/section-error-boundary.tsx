"use client";

import { Component, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallback: ReactNode;
  label: string;
};

type State = {
  hasError: boolean;
};

/** ダッシュボード内の重いクライアント塊用。ページ全体ではなく当該セクションだけ失敗表示する。 */
export class DashboardSectionErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error(`[dashboard] ${this.props.label} failed`, error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
