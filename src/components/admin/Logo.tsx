export function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span
        aria-hidden="true"
        style={{ width: 22, height: 14, background: '#96c11f', display: 'inline-block', transform: 'skewX(-12deg)', borderRadius: 2 }}
      />
      <strong style={{ fontSize: 22, letterSpacing: '-0.01em' }}>EazyBase</strong>
    </div>
  )
}

export default Logo
