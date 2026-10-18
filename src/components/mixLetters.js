// Up to `count` letters in a mixed order for the Learn and Practice art:
// alternately from the start and the end of the list (B, Y, C, W, D…). Always
// the same order, so the page doesn't change on every visit.
export function mixLetters(letters, count = 5) {
  const mixed = []
  let start = 0
  let end = letters.length - 1
  while (start <= end && mixed.length < count) {
    mixed.push(letters[start++])
    if (start <= end && mixed.length < count) mixed.push(letters[end--])
  }
  return mixed
}
