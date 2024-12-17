export function createLangError({
  src,
  col,
  line,
  message,
  errorType,
}: {
  src: string
  col: number
  line: number
  message: string
  errorType: ErrorType
}): LangError {
  return new LangError(src, col, line, errorType, message)
}

export const ERROR_TYPES = ['SyntaxError'] as const
export type ErrorType = (typeof ERROR_TYPES)[number]

export class LangError extends Error {
  constructor(
    private readonly src: string,
    private readonly col: number,
    private readonly line: number,
    private readonly errorType: ErrorType,
    private readonly errorMessage: string,
  ) {
    super(formatError({ src, col, line, errorMessage, errorType }))
  }
}

function formatError({
  src,
  col,
  line,
  errorMessage,
  errorType,
}: {
  src: string
  col: number
  line: number
  errorMessage: string
  errorType: ErrorType
}) {
  let lineCount = 1
  let i = 0

  let mode: 'start' | 'stop' | undefined =
    line === lineCount ? 'start' : undefined
  let message = mode === 'start' ? `${lineCount} | ` : ''
  let spacer = message.length

  while (i < src.length && mode !== 'stop') {
    const char = src[i]

    if (mode === 'start') {
      if (char === '\n') {
        mode = 'stop'
      } else {
        message = `${message}${src[i]}`
      }
    }

    if (char === '\n') {
      lineCount += 1
      if (lineCount === line) {
        mode = 'start'
        message = `${lineCount} | `
        spacer = message.length
      }
    }

    i += 1
  }

  // col starts with first index, because of which we have to subtract - 1
  message = `${message}\n${repeat(' ', col - 1 + spacer)}^^\n${errorType}: ${errorMessage}`

  return box(message, 2)
}

function repeat(char: string, count: number) {
  let message = ''
  for (let i = 0; i < count; i++) {
    message += char
  }
  return message
}

const BORDER = {
  HORIZONTAL: '═',
  VERTICAL: '║',
  TOP_LEFT: '╔',
  TOP_RIGHT: '╗',
  BOTTOM_LEFT: '╚',
  BOTTOM_RIGHT: '╝',
} as const

function box(str: string, padding: number = 1) {
  const lines = str.split('\n')
  const maxChars = Math.max(...lines.map((line) => line.length))
  const horizontalChars = maxChars + 2 * padding

  return [
    `${BORDER.TOP_LEFT}${repeat(BORDER.HORIZONTAL, horizontalChars)}${BORDER.TOP_RIGHT}`,
    ...lines.map((line) => {
      const chars = line.length
      const spaces = maxChars - chars
      return `${BORDER.VERTICAL}${repeat(' ', padding)}${line}${repeat(' ', spaces + padding)}${BORDER.VERTICAL}`
    }),
    `${BORDER.BOTTOM_LEFT}${repeat(BORDER.HORIZONTAL, horizontalChars)}${BORDER.BOTTOM_RIGHT}`,
  ].join('\n')
}
