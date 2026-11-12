/**
 * Scroll management for the kiosk.
 *
 * The app normally scrolls the document, but screens can be embedded in a
 * scrollable container (for example a wrapper with `overflow-y: auto`). Both
 * are reset here, so a new screen always starts at its heading instead of
 * inheriting the previous screen's position.
 */

/** Any element marked with this attribute is treated as a scroll container. */
const SCROLL_ROOT_SELECTOR = '[data-scroll-root]'

export function resetScrollPosition(container?: HTMLElement | null) {
  if (typeof document === 'undefined') return

  const candidates: Array<HTMLElement | null> = [
    container ?? null,
    document.documentElement,
    document.body,
  ]

  document.querySelectorAll<HTMLElement>(SCROLL_ROOT_SELECTOR).forEach((node) => candidates.push(node))

  for (const node of candidates) {
    if (!node) continue
    if (node.scrollTop !== 0) node.scrollTop = 0
    if (node.scrollLeft !== 0) node.scrollLeft = 0
  }

  if (typeof window !== 'undefined') {
    // 'auto' keeps the jump instant so the heading is readable immediately.
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }
}

/**
 * Brings an invalid field into view and focuses it.
 *
 * The scroll happens first (instant, centred, with a CSS scroll margin for the
 * sticky header), then focus is applied with `preventScroll` so focusing does
 * not undo the position we just chose. Non-focusable wrappers (radio groups)
 * are resolved to their first interactive descendant.
 */
export function focusField(element: HTMLElement | null | undefined) {
  if (!element) return

  element.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' })

  const focusable =
    element.matches('input, select, textarea, button, [href], [tabindex]')
      ? element
      : element.querySelector<HTMLElement>('input, select, textarea, button, [href], [tabindex]')

  if (!focusable) return

  try {
    focusable.focus({ preventScroll: true })
  } catch {
    focusable.focus()
  }
}
