import React from 'react'

/**
 * The EazyBase logo mark (green tick + layered grey chevron + green tip).
 * Pure SVG so it can be used in both server and client components. Colours are
 * baked into the paths (brand green + two greys) — it reads on light surfaces;
 * on dark surfaces place it inside a light badge.
 */
export function EazyBaseMark({
  className,
  style,
  title = 'EazyBase',
}: {
  className?: string
  style?: React.CSSProperties
  title?: string
}) {
  return (
    <svg viewBox="0 0 48 48" className={className} style={style} role="img" aria-label={title}>
      <path
        fill="#96c13e"
        d="M34,16.98l-14.86,14.83-6.97-6.75-.45-.06-1.7-.28c-.46-.08-1.36-.49-1.65-.86-.34-.42-.21-1.66.11-2.17l13.96-13.91c.62-.49,2-.49,2.57.08l8.98,9.12Z"
      />
      <polygon
        fill="#595958"
        points="39.79 16.42 38.36 17.37 19.12 36.48 12.09 29.51 12.17 25.06 19.14 31.81 34 16.98 39.65 11.46 39.79 16.42"
      />
      <polygon
        fill="#888986"
        points="39.79 16.42 39.82 19.99 19.08 40.58 11.98 33.42 12.17 25.06 12.17 25.06 12.09 29.51 19.12 36.48 38.36 17.37 39.79 16.42"
      />
      <path
        fill="#99c340"
        d="M35.51,36.62c.01,1.03-1.01,2.11-1.93,2.1l-9.3-.07,11.13-11.03.11,9Z"
      />
    </svg>
  )
}

export default EazyBaseMark
