export type ErrorType = 'SyntaxError'

export class LangError extends Error {
  constructor(
    private readonly src: string,
    private readonly col: number,
    private readonly line: number,
    private readonly errorType: ErrorType,
    private readonly errorMessage: string,
  ) {
    super(errorMessage)
  }

  format() {
    let line = 1
    let i = 0

    let mode: 'start' | 'stop' | undefined =
      this.line === line ? 'start' : undefined
    let message = mode === 'start' ? `${line} | ` : ''
    let spacer = message.length

    while (i < this.src.length && mode !== 'stop') {
      const char = this.src[i]

      if (mode === 'start') {
        if (char === '\n') {
          mode = 'stop'
        } else {
          message = `${message}${this.src[i]}`
        }
      }

      if (char === '\n') {
        line += 1
        if (line === this.line) {
          mode = 'start'
          message = `${line} | `
          spacer = message.length
        }
      }

      i += 1
    }

    // col starts with first index, because of which we have to subtract - 1
    message = `${message}\n${repeat(' ', this.col - 1 + spacer)}^^\n${this.errorType}: ${this.errorMessage}`

    return message
  }
}

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

function repeat(char: string, count: number) {
  let message = ''
  for (let i = 0; i < count; i++) {
    message += char
  }
  return message
}
