import { match } from 'ts-pattern'
import type { Expression } from './ast'

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

export function formatExpression(expression: Expression): string {
  return match(expression)
    .returnType<string>()
    .with({ expressionType: 'primary' }, ({ value }) => {
      return String(value)
    })
    .with({ expressionType: 'ident' }, ({ identifier }) => {
      return identifier
    })
    .with({ expressionType: 'prefix' }, ({ operator, right }) => {
      return `(${operator} ${right})`
    })
    .with({ expressionType: 'infix' }, ({ operator, right, left }) => {
      return `(${formatExpression(left)} ${operator} ${formatExpression(right)})`
    })
    .with({ expressionType: 'call' }, ({ args, functionName }) => {
      return `${functionName}(${args.map(formatExpression).join(', ')})`
    })
    .otherwise(() => {
      throw new Error('unknown expression')
    })
}

export function repeat(char: string, count: number) {
  let message = ''
  for (let i = 0; i < count; i++) {
    message += char
  }
  return message
}

const BORDER = {
  HORIZONTAL: '─',
  VERTICAL: '│',
  TOP_LEFT: '╭',
  TOP_RIGHT: '╮',
  BOTTOM_LEFT: '╰',
  BOTTOM_RIGHT: '╯',
} as const

function getCharacterLength(str: string) {
  // Remove ANSI escape sequences
  // eslint-disable-next-line no-control-regex
  const cleanStr = str.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '')
  // Return the length of the cleaned string
  return [...cleanStr].length
}

export function box(str: string, padding: number = 1) {
  const lines = str.split('\n')
  const maxChars = Math.max(
    ...lines.map((line) => {
      return getCharacterLength(line)
    }),
  )
  const horizontalChars = maxChars + 2 * padding

  return [
    `${BORDER.TOP_LEFT}${repeat(BORDER.HORIZONTAL, horizontalChars)}${BORDER.TOP_RIGHT}`,
    ...lines.map((line) => {
      const chars = getCharacterLength(line)
      const spaces = maxChars - chars
      return `${BORDER.VERTICAL}${repeat(' ', padding)}${line}${repeat(' ', spaces + padding)}${BORDER.VERTICAL}`
    }),
    `${BORDER.BOTTOM_LEFT}${repeat(BORDER.HORIZONTAL, horizontalChars)}${BORDER.BOTTOM_RIGHT}`,
  ].join('\n')
}
