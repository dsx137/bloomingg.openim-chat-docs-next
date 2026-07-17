'use client';

import Link from 'next/link';
import { Component, type CSSProperties, type ReactNode, type SyntheticEvent } from 'react';

type SidebarGroupProps = {
  active: boolean;
  activeOpen: boolean;
  children: ReactNode;
  depth: number;
  href?: string;
  initialOpen: boolean;
  title: string;
};

type SidebarGroupState = {
  open: boolean;
  openedByRoute: boolean;
};

export class SidebarGroup extends Component<SidebarGroupProps, SidebarGroupState> {
  state: SidebarGroupState = {
    open: this.props.initialOpen,
    openedByRoute: this.props.activeOpen,
  };

  static getDerivedStateFromProps(
    props: SidebarGroupProps,
    state: SidebarGroupState,
  ): Partial<SidebarGroupState> | null {
    if (props.activeOpen && !state.openedByRoute) return { openedByRoute: true };
    return null;
  }

  private handleToggle = (event: SyntheticEvent<HTMLDetailsElement>) => {
    const nextOpen = event.currentTarget.open;

    this.setState((state) => ({
      open: nextOpen,
      openedByRoute: nextOpen || this.props.activeOpen ? state.openedByRoute : false,
    }));
  };

  render() {
    const { active, activeOpen, children, depth, href, title } = this.props;
    const renderedOpen = this.state.open || activeOpen || this.state.openedByRoute;

    return (
      <details className="sidebar-group" onToggle={this.handleToggle} open={renderedOpen}>
        <summary style={{ '--nav-depth': depth } as CSSProperties}>
          {href ? (
            <Link aria-current={active ? 'page' : undefined} href={href}>
              {title}
            </Link>
          ) : (
            <span>{title}</span>
          )}
        </summary>
        <div>{children}</div>
      </details>
    );
  }
}
