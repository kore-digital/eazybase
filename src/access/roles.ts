import type { Access, FieldAccess } from 'payload'

export type Role = 'admin' | 'editor'

/** Safely read the role off req.user (typed loosely so this file never races the generated types). */
const roleOf = (user: unknown): Role | undefined =>
  (user as { role?: Role } | null | undefined)?.role ?? undefined

/** Collection-level: only admins. */
export const isAdmin: Access = ({ req: { user } }) => roleOf(user) === 'admin'

/** Collection-level: admins and editors. */
export const isAdminOrEditor: Access = ({ req: { user } }) => {
  const role = roleOf(user)
  return role === 'admin' || role === 'editor'
}

/** Anyone, including the public (e.g. QuoteRequests create). */
export const anyone: Access = () => true

/**
 * Public sees published docs only; any logged-in user sees everything.
 * For collections with a `published` checkbox (Pages, Areas).
 */
export const publishedOrLoggedIn: Access = ({ req: { user } }) => {
  if (user) return true
  return { published: { equals: true } }
}

/** Field-level: only admins may read/set the field. */
export const isAdminFieldLevel: FieldAccess = ({ req: { user } }) => roleOf(user) === 'admin'

/** Users collection: admins see everyone; others see only themselves. */
export const isAdminOrSelf: Access = ({ req: { user } }) => {
  if (!user) return false
  if (roleOf(user) === 'admin') return true
  return { id: { equals: user.id } }
}
