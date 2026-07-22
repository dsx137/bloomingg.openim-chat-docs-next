'use client';

import Link from 'next/link';
import {
  Component,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
  type SyntheticEvent,
} from 'react';

const groupOpenMemory = new Map<string, boolean>();

type SidebarGroupProps = {
  active: boolean;
  activeOpen: boolean;
  children: ReactNode;
  depth: number;
  href?: string;
  initialOpen: boolean;
  stateKey: string;
  title: ReactNode;
};

type SidebarGroupState = {
  open: boolean;
  openedByRoute: boolean;
};

export class SidebarGroup extends Component<SidebarGroupProps, SidebarGroupState> {
  state: SidebarGroupState = {
    open: groupOpenMemory.get(this.props.stateKey) ?? this.props.initialOpen,
    openedByRoute:
      !groupOpenMemory.has(this.props.stateKey) && this.props.initialOpen && this.props.activeOpen,
  };

  private userTogglePending = false;

  componentDidUpdate(previousProps: SidebarGroupProps) {
    const becameActive = this.props.activeOpen && !previousProps.activeOpen;
    const becameInactive = !this.props.activeOpen && previousProps.activeOpen;

    if (becameActive && !groupOpenMemory.has(this.props.stateKey)) {
      this.setState({ open: true, openedByRoute: true });
    } else if (becameInactive && this.state.openedByRoute) {
      this.setState({ open: false, openedByRoute: false });
    }
  }

  private handleSummaryClick = (event: MouseEvent<HTMLElement>) => {
    if (event.target instanceof Element && event.target.closest('a[href]')) return;
    this.userTogglePending = true;
  };

  private handleToggle = (event: SyntheticEvent<HTMLDetailsElement>) => {
    if (!this.userTogglePending) return;
    this.userTogglePending = false;
    const nextOpen = event.currentTarget.open;
    groupOpenMemory.set(this.props.stateKey, nextOpen);
    this.setState({ open: nextOpen, openedByRoute: false });
  };

  render() {
    const { active, children, depth, href, title } = this.props;

    return (
      <details className="sidebar-group" onToggle={this.handleToggle} open={this.state.open}>
        <summary
          onClick={this.handleSummaryClick}
          style={{ '--nav-depth': depth } as CSSProperties}
        >
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
