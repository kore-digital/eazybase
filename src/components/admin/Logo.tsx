/** Admin login + nav logo — the EazyBase mark + wordmark. Inlined SVG so the
 *  admin never depends on an extra import resolving through the importMap. */
export function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <svg viewBox="0 0 48 48" style={{ width: 40, height: 40 }} aria-hidden="true">
        <path fill="#96c13e" d="M34,16.98l-14.86,14.83-6.97-6.75-.45-.06-1.7-.28c-.46-.08-1.36-.49-1.65-.86-.34-.42-.21-1.66.11-2.17l13.96-13.91c.62-.49,2-.49,2.57.08l8.98,9.12Z" />
        <polygon fill="#595958" points="39.79 16.42 38.36 17.37 19.12 36.48 12.09 29.51 12.17 25.06 19.14 31.81 34 16.98 39.65 11.46 39.79 16.42" />
        <polygon fill="#888986" points="39.79 16.42 39.82 19.99 19.08 40.58 11.98 33.42 12.17 25.06 12.17 25.06 12.09 29.51 19.12 36.48 38.36 17.37 39.79 16.42" />
        <path fill="#99c340" d="M35.51,36.62c.01,1.03-1.01,2.11-1.93,2.1l-9.3-.07,11.13-11.03.11,9Z" />
      </svg>
      <strong style={{ fontSize: 24, letterSpacing: '-0.01em' }}>EazyBase</strong>
    </div>
  )
}

export default Logo
