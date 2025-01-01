import { match } from 'ts-pattern'
import type { Expression } from './ast'

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
    .exhaustive()
}