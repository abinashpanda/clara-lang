import { repeat } from './utils'

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
    readonly src: string,
    readonly col: number,
    readonly line: number,
    readonly errorType: ErrorType,
    readonly errorMessage: string,
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

  return message
}
