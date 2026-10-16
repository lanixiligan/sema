// Line icons from the designs, used on more than one page. They draw in
// currentColor, so the surrounding CSS picks their colour. They're decoration:
// the text beside them says the same thing, so wrap them in aria-hidden.

export function HandIcon({ size = 18, strokeWidth = 1.3 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 14V7.5a1.2 1.2 0 012.4 0V9M7.4 8.5V4a1.2 1.2 0 012.4 0v4.5M9.8 8V5a1.2 1.2 0 012.4 0v5.5c0 2-1.5 3.5-3.5 3.5H8c-1.4 0-2.3-.6-3-1.6L3.4 10a1.2 1.2 0 012-1.3L5 9" />
    </svg>
  )
}

export function LockIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="3" y="7" width="10" height="7" rx="1.5" />
      <path d="M5.5 7V5a2.5 2.5 0 015 0v2" />
    </svg>
  )
}

export function CheckIcon({ size = 14, strokeWidth = 2.4 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 11.5l4 4 8-9" />
    </svg>
  )
}
