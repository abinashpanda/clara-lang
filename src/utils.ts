export type Nullable<T> = T | null

export function invariant(
  condition: unknown,
  message: string | (() => string),
): asserts condition {
  const prefix = 'InvariantError'
  if (!condition) {
    const messageStr = typeof message === 'function' ? message() : message
    const errorMessage =
      process.env.NODE_ENV === 'production'
        ? prefix
        : `${prefix}: ${messageStr}`
    throw new Error(errorMessage)
  }
}

const BORDER_TYPES = {
  normal: {
    HORIZONTAL: '─',
    VERTICAL: '│',
    TOP_LEFT: '┌',
    TOP_RIGHT: '┐',
    BOTTOM_LEFT: '└',
    BOTTOM_RIGHT: '┘',
  },
  rounded: {
    HORIZONTAL: '─',
    VERTICAL: '│',
    TOP_LEFT: '╭',
    TOP_RIGHT: '╮',
    BOTTOM_LEFT: '╰',
    BOTTOM_RIGHT: '╯',
  },
} satisfies Record<
  string,
  {
    HORIZONTAL: string
    VERTICAL: string
    TOP_LEFT: string
    TOP_RIGHT: string
    BOTTOM_LEFT: string
    BOTTOM_RIGHT: string
  }
>
type BorderType = keyof typeof BORDER_TYPES

export function box(
  str: string,
  opts?: {
    padding?: number
    borderType?: BorderType
  },
) {
  const borderType = opts?.borderType ?? 'normal'
  const border = BORDER_TYPES[borderType]

  const lines = str.split('\n')
  const maxChars = Math.max(
    ...lines.map((line) => {
      return getCharacterLength(line)
    }),
  )

  const padding = opts?.padding ?? 1
  const horizontalLength = maxChars + 2 * padding

  return [
    `${border.TOP_LEFT}${repeat(border.HORIZONTAL, horizontalLength)}${border.TOP_RIGHT}`,
    ...lines.map((line) => {
      const chars = getCharacterLength(line)
      const spaces = maxChars - chars
      return `${border.VERTICAL}${repeat(' ', padding)}${line}${repeat(' ', spaces + padding)}${border.VERTICAL}`
    }),
    `${border.BOTTOM_LEFT}${repeat(border.HORIZONTAL, horizontalLength)}${border.BOTTOM_RIGHT}`,
  ].join('\n')
}

function getCharacterLength(str: string) {
  // Remove ANSI escape sequences
  // eslint-disable-next-line no-control-regex
  const cleanStr = str.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '')
  // Return the length of the cleaned string
  return [...cleanStr].length
}

export function repeat(char: string, count: number) {
  let message = ''
  for (let i = 0; i < count; i++) {
    message += char
  }
  return message
}
