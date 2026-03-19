import React from 'react';

type IconProps = React.SVGProps<SVGSVGElement> & { title?: string };

function baseProps(props: IconProps) {
  const { title, ...rest } = props;
  return {
    viewBox: '0 0 24 24',
    width: 20,
    height: 20,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': title ? undefined : true,
    role: title ? 'img' : 'presentation',
    ...rest,
  };
}

export function IconGrid(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" />
    </svg>
  );
}

export function IconReceipt(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M7 3h10v18l-2-1-2 1-2-1-2 1-2-1-2 1V3z" />
      <path d="M9 7h6M9 11h6M9 15h4" />
    </svg>
  );
}

export function IconBoxes(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="M3.3 7 12 12l8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}

export function IconChart(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M3 3v18h18" />
      <path d="M7 14v4M12 10v8M17 6v12" />
    </svg>
  );
}

export function IconSettings(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M19.4 15a7.8 7.8 0 0 0 .1-1l2-1.2-2-3.4-2.3.6a7.8 7.8 0 0 0-1.7-1L15 6h-6l-.5 2.9a7.8 7.8 0 0 0-1.7 1l-2.3-.6-2 3.4 2 1.2a7.8 7.8 0 0 0 0 2l-2 1.2 2 3.4 2.3-.6a7.8 7.8 0 0 0 1.7 1L9 21h6l.5-2.9a7.8 7.8 0 0 0 1.7-1l2.3.6 2-3.4-2-1.2Z" />
    </svg>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

export function IconBell(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}
