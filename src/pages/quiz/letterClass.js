// The CSS class for a letter's tile: its mark once asked, else "current".
export function letterClass(mark, current) {
  if (mark) return `quiz-${mark}`
  return current ? 'quiz-current' : ''
}
