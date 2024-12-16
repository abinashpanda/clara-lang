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
    .with({ expressionType: 'prefix' }, ({ operator, right }) => {
      return `(${operator} ${right})`
    })
    .with({ expressionType: 'infix' }, ({ operator, right, left }) => {
      return `(${formatExpression(left)} ${operator} ${formatExpression(right)})`
    })
    .otherwise(() => {
      throw new Error('unknown expression')
    })
}
