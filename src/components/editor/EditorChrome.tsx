'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

import { revalidateAllContent, revalidateContent } from '@/app/(frontend)/actions/revalidate'

import { AdminBar } from './AdminBar'
import { adminUrlFor, parseEditKey, saveEditKey, tagsForSave } from './edit-api'
import { MediaSidebar } from './MediaSidebar'
import type { EditorUser } from './EditorOverlay'

/**
 * The authenticated editor chrome: admin bar + inline-editing engine.
 * Lazy-loaded by EditorOverlay only after /api/users/me succeeds, so it adds
 * zero bundle weight for anonymous visitors.
 *
 * Edit mode (?edit=1 or the admin-bar toggle):
 *  - [data-eb-edit] nodes get a dashed brand-green outline + pencil pill on
 *    hover; click starts a contentEditable session. Blur or Cmd/Ctrl+Enter
 *    saves via Payload REST (PATCH), Esc cancels and restores the original.
 *  - [data-eb-edit-rich] nodes (Lexical richtext) deep-link to the admin
 *    edit view in a new tab instead — richtext is not safe as plain text.
 *  - After a save, the matching cache tags are revalidated server-side and
 *    the route refreshed so the server-rendered copy matches the CMS.
 */

const BAR_HEIGHT = '2.5rem'

type Session = {
  el: HTMLElement
  key: string
  original: string
  cleanup: () => void
}

type Chip = { x: number; y: number; status: 'saving' | 'saved' }
type HoverPill = { x: number; y: number; label: string }

const EDITOR_CSS = `
html.eb-authed { --eb-adminbar-h: ${BAR_HEIGHT}; }
html.eb-authed body { padding-top: var(--eb-adminbar-h); }
html.eb-authed body > header { top: var(--eb-adminbar-h); }
html.eb-edit-mode [data-eb-edit],
html.eb-edit-mode [data-eb-edit-rich],
html.eb-edit-mode [data-eb-edit-media] { cursor: pointer; }
html.eb-edit-mode [data-eb-edit]:hover,
html.eb-edit-mode [data-eb-edit-rich]:hover,
html.eb-edit-mode [data-eb-edit-media]:hover {
  outline: 2px dashed #96c11f;
  outline-offset: 3px;
  border-radius: 2px;
}
html.eb-edit-mode .eb-editing {
  outline: 2px solid #96c11f !important;
  outline-offset: 3px;
  border-radius: 2px;
  background: rgba(150, 193, 31, 0.08);
  cursor: text !important;
}
`

export default function EditorChrome({ user }: { user: EditorUser }) {
  const router = useRouter()
  const pathname = usePathname()

  const [editMode, setEditModeState] = useState(false)
  const [chip, setChip] = useState<Chip | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [pill, setPill] = useState<HoverPill | null>(null)
  const [mediaKey, setMediaKey] = useState<string | null>(null)
  const [mediaBusy, setMediaBusy] = useState(false)

  const sessionRef = useRef<Session | null>(null)
  const chipTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* ------------------------------------------------ mode + html classes */

  useEffect(() => {
    document.documentElement.classList.add('eb-authed')
    if (new URLSearchParams(window.location.search).get('edit') === '1') {
      setEditModeState(true)
    }
    return () => {
      document.documentElement.classList.remove('eb-authed')
    }
  }, [])

  const setEditMode = useCallback((on: boolean) => {
    setEditModeState(on)
    const url = new URL(window.location.href)
    if (on) url.searchParams.set('edit', '1')
    else url.searchParams.delete('edit')
    window.history.replaceState(null, '', url.toString())
  }, [])

  /* --------------------------------------------- dev-only coverage check */

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    const plain = document.querySelectorAll('[data-eb-edit]').length
    const rich = document.querySelectorAll('[data-eb-edit-rich]').length
    console.info(
      `[eb-editor] ${pathname}: ${plain} inline-editable node${plain === 1 ? '' : 's'}, ` +
        `${rich} rich-text node${rich === 1 ? '' : 's'} (admin-linked)`,
    )
  }, [pathname])

  /* -------------------------------------------------------- save / edit */

  const showToast = useCallback((message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(message)
    toastTimer.current = setTimeout(() => setToast(null), 4500)
  }, [])

  const showChip = useCallback((rect: DOMRect, status: Chip['status']) => {
    if (chipTimer.current) clearTimeout(chipTimer.current)
    const x = Math.min(Math.max(rect.right, 12), window.innerWidth - 96)
    const y = Math.max(rect.top - 10, 48)
    setChip({ x, y, status })
    if (status === 'saved') {
      chipTimer.current = setTimeout(() => setChip(null), 1400)
    }
  }, [])

  const save = useCallback(
    async (session: Session, text: string) => {
      const parsed = parseEditKey(session.key)
      if (!parsed) {
        session.el.textContent = session.original
        showToast(`Invalid edit key: ${session.key}`)
        return
      }
      const rect = session.el.getBoundingClientRect()
      showChip(rect, 'saving')
      try {
        const response = await saveEditKey(parsed, text)
        showChip(rect, 'saved')
        await revalidateContent(tagsForSave(parsed, response))
        router.refresh()
      } catch (err) {
        session.el.textContent = session.original
        setChip(null)
        // edit-api errors carry user-appropriate messages (e.g. a row that
        // was deleted/reordered in the admin since this page rendered).
        showToast(
          err instanceof Error && err.message
            ? `${err.message} The text has been restored.`
            : 'Could not save that change — the text has been restored.',
        )
      }
    },
    [router, showChip, showToast],
  )

  // Swap an image: PATCH the media relation to the picked/uploaded media id,
  // then revalidate + refresh so the new image renders. Same persistence path
  // as text edits, just an id value instead of a string.
  const onSelectMedia = useCallback(
    async (id: number) => {
      if (!mediaKey) return
      const parsed = parseEditKey(mediaKey)
      if (!parsed) {
        setMediaKey(null)
        showToast(`Invalid image key: ${mediaKey}`)
        return
      }
      setMediaBusy(true)
      try {
        const response = await saveEditKey(parsed, id)
        await revalidateContent(tagsForSave(parsed, response))
        router.refresh()
        setMediaKey(null)
      } catch {
        showToast('Could not update the image — please try again.')
      } finally {
        setMediaBusy(false)
      }
    },
    [mediaKey, router, showToast],
  )

  const commitSession = useCallback(() => {
    const session = sessionRef.current
    if (!session) return
    sessionRef.current = null
    session.cleanup()
    const text = session.el.innerText.trim()
    if (text === session.original.trim()) {
      // No change — put the exact original back (contentEditable can
      // normalise whitespace) and walk away quietly.
      session.el.textContent = session.original
      return
    }
    void save(session, text)
  }, [save])

  const cancelSession = useCallback(() => {
    const session = sessionRef.current
    if (!session) return
    sessionRef.current = null
    session.cleanup()
    session.el.textContent = session.original
  }, [])

  const beginSession = useCallback(
    (el: HTMLElement, key: string) => {
      const original = el.innerText
      el.contentEditable = 'plaintext-only'
      if (el.contentEditable !== 'plaintext-only') el.contentEditable = 'true'
      el.classList.add('eb-editing')
      el.setAttribute('spellcheck', 'true')

      const onKeyDown = (ev: KeyboardEvent) => {
        if (ev.key === 'Escape') {
          ev.preventDefault()
          ev.stopPropagation()
          cancelSession()
        } else if (ev.key === 'Enter' && (ev.metaKey || ev.ctrlKey)) {
          ev.preventDefault()
          commitSession()
        }
      }
      const onBlur = () => commitSession()

      el.addEventListener('keydown', onKeyDown)
      el.addEventListener('blur', onBlur)

      sessionRef.current = {
        el,
        key,
        original,
        cleanup: () => {
          el.removeEventListener('keydown', onKeyDown)
          el.removeEventListener('blur', onBlur)
          el.classList.remove('eb-editing')
          el.removeAttribute('contenteditable')
          el.removeAttribute('spellcheck')
        },
      }

      setPill(null)
      el.focus()
      const range = document.createRange()
      range.selectNodeContents(el)
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)
    },
    [cancelSession, commitSession],
  )

  /* -------------------------------------------- edit-mode DOM delegation */

  useEffect(() => {
    if (!editMode) return
    document.documentElement.classList.add('eb-edit-mode')

    const onClick = (e: MouseEvent) => {
      const origin = e.target as Element | null
      if (!origin || origin.closest('[data-eb-chrome]')) return
      const target = origin.closest<HTMLElement>(
        '[data-eb-edit], [data-eb-edit-rich], [data-eb-edit-media]',
      )
      if (!target) return

      // Clicks inside the active session reposition the caret; just make
      // sure a wrapping link never navigates.
      if (sessionRef.current?.el === target) {
        e.preventDefault()
        return
      }

      e.preventDefault()
      e.stopPropagation()

      // Image → open the media picker sidebar.
      const mediaK = target.getAttribute('data-eb-edit-media')
      if (mediaK) {
        setPill(null)
        setMediaKey(mediaK)
        return
      }

      const richKey = target.getAttribute('data-eb-edit-rich')
      if (richKey) {
        const parsed = parseEditKey(richKey)
        if (parsed) window.open(adminUrlFor(parsed), '_blank', 'noopener')
        return
      }

      const key = target.getAttribute('data-eb-edit')
      if (key) beginSession(target, key)
    }

    const onMouseOver = (e: MouseEvent) => {
      const origin = e.target as Element | null
      const target =
        origin && !origin.closest('[data-eb-chrome]')
          ? origin.closest<HTMLElement>('[data-eb-edit], [data-eb-edit-rich], [data-eb-edit-media]')
          : null
      if (!target || sessionRef.current?.el === target) {
        setPill(null)
        return
      }
      const rect = target.getBoundingClientRect()
      const label = target.hasAttribute('data-eb-edit-media')
        ? 'Change image'
        : target.hasAttribute('data-eb-edit-rich')
          ? 'Edit in admin'
          : 'Click to edit'
      setPill({
        x: Math.min(Math.max(rect.left, 8), window.innerWidth - 140),
        y: Math.max(rect.top - 26, 44),
        label,
      })
    }

    const onScroll = () => setPill(null)

    document.addEventListener('click', onClick, true)
    document.addEventListener('mouseover', onMouseOver, true)
    window.addEventListener('scroll', onScroll, { passive: true, capture: true })

    return () => {
      document.documentElement.classList.remove('eb-edit-mode')
      document.removeEventListener('click', onClick, true)
      document.removeEventListener('mouseover', onMouseOver, true)
      window.removeEventListener('scroll', onScroll, { capture: true })
      cancelSession()
      setPill(null)
    }
  }, [editMode, beginSession, cancelSession])

  /* -------------------------------------------------------------- render */

  const refreshContent = useCallback(async () => {
    await revalidateAllContent()
    router.refresh()
  }, [router])

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: EDITOR_CSS }} />

      <AdminBar
        user={user}
        editMode={editMode}
        onToggleEdit={setEditMode}
        onRefreshContent={refreshContent}
      />

      {/* Hover affordance — pencil pill above the editable node */}
      {pill && (
        <div
          data-eb-chrome
          aria-hidden="true"
          className="pointer-events-none fixed z-[110] flex items-center gap-1.5 rounded-full bg-ink-950 px-2.5 py-1 font-body text-[11px] font-semibold text-white shadow-lg"
          style={{ left: pill.x, top: pill.y }}
        >
          <PencilIcon />
          {pill.label}
        </div>
      )}

      {/* Image media picker */}
      {mediaKey && (
        <MediaSidebar onSelect={onSelectMedia} onClose={() => setMediaKey(null)} busy={mediaBusy} />
      )}

      {/* Save-state chip */}
      {chip && (
        <div
          data-eb-chrome
          role="status"
          className="pointer-events-none fixed z-[110] flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 font-body text-[11px] font-semibold shadow-lg ring-1 ring-ink-200"
          style={{ left: chip.x, top: chip.y }}
        >
          {chip.status === 'saving' ? (
            <>
              <Spinner />
              <span className="text-ink-600">Saving…</span>
            </>
          ) : (
            <>
              <TickIcon />
              <span className="text-brand-700">Saved</span>
            </>
          )}
        </div>
      )}

      {/* Failure toast */}
      {toast && (
        <div
          data-eb-chrome
          role="alert"
          className="fixed bottom-6 left-1/2 z-[110] -translate-x-1/2 rounded-md bg-red-700 px-4 py-2.5 font-body text-sm font-medium text-white shadow-xl"
        >
          {toast}
        </div>
      )}
    </>
  )
}

/* ---------------------------------------------------------------- icons */

function PencilIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Spinner() {
  return (
    <svg
      className="animate-spin text-ink-500"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3.5" opacity="0.25" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function TickIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m4 12.5 5.5 5.5L20 6.5"
        stroke="#96c11f"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
