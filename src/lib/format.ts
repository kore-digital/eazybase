/**
 * Phone / contact display helpers.
 *
 * The live site mixed "03302 290 775" (header) and "0330 229 0775"
 * (body/footer) — the audit (§9.3) says standardise. These helpers are the
 * single source of truth for display formatting.
 */

/** Strip everything except digits (and a leading +) — safe for tel: hrefs. */
export function cleanPhone(raw: string): string {
  const cleaned = raw.replace(/[^\d+]/g, '')
  // Only allow "+" at the very start
  return cleaned.startsWith('+') ? `+${cleaned.slice(1).replace(/\D/g, '')}` : cleaned.replace(/\D/g, '')
}

/**
 * Format a UK phone number for display.
 * - '03302290775'  → '0330 229 0775'  (11-digit 03xx non-geographic)
 * - '447845655113' → '+44 7845 655 113' (international mobile)
 * Unknown shapes are returned as-is.
 */
export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')

  if (digits.length === 11 && digits.startsWith('0')) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
  }
  if (digits.length === 12 && digits.startsWith('44')) {
    return `+44 ${digits.slice(2, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`
  }
  return raw
}

/** Build a click-to-call href from any phone string. */
export function telHref(raw: string): string {
  return `tel:${cleanPhone(raw)}`
}

/** Build a wa.me link with an optional pre-filled message. */
export function waHref(number: string, text?: string): string {
  const base = `https://wa.me/${number.replace(/\D/g, '')}`
  return text ? `${base}?text=${encodeURIComponent(text)}` : base
}
