export function fullMatch(regex: RegExp, str: string) {
  const match = regex.exec(str)
  if (!match) {
    return false
  }
  return match[0] === str
}
