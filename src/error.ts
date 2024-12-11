export type ErrorType = 'SyntaxError'

export type LangError = {
  col: number
  line: number
  errorType: ErrorType
  error: Error
}

export function createError({
  col,
  line,
  message,
  errorType,
}: {
  col: number
  line: number
  message: string
  errorType: ErrorType
}): LangError {
  return {
    col,
    line,
    errorType,
    error: new Error(message),
  }
}

export function formatError(input: string, langError: LangError): string {
  let line = 1
  const i = 0

  let mode: 'start' | 'stop' | undefined =
    langError.line === line ? 'start' : undefined
  let message = mode === 'start' ? `${line} | ` : ''
  let spacer = message.length

  while (i < input.length && mode !== 'stop') {
    const char = input[i]

    if (char === '\n') {
      if (mode === 'start') {
        mode = 'stop'
      } else {
        line += 1
        if (line === langError.line) {
          mode = 'start'
          message = `${line} | `
          spacer = message.length
        }
      }
    } else {
      message = `${message}${input[i]}`
    }
  }

  message = `${message}\n${repeat(' ', langError.col)}^^\n${repeat(' ', spacer)}${langError.errorType}: ${langError.error.message}`

  return message
}

function repeat(char: string, count: number) {
  let message = ''
  for (let i = 0; i < count; i++) {
    message += char
  }
  return message
}
