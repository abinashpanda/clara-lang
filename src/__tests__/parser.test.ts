import { test, expect, beforeEach } from 'bun:test'
import { Lexer } from '../lexer'
import { Parser } from '../parser'
import { formatExpression } from '../utils'
import { Context } from '../context'

const context = new Context()
beforeEach(() => {
  context.reset()
})

test('Parser parses expression statement correctly', () => {
  const tests: { input: string; output: string }[] = [
    {
      input: '2 + 3',
      output: '(2 + 3)',
    },
    {
      input: '1 + 2 * 3',
      output: '(1 + (2 * 3))',
    },
    {
      input: '1 + 2 * 3 - 4',
      output: '((1 + (2 * 3)) - 4)',
    },
    {
      input: '(1 + 2) * 3 - (4 - 3)',
      output: '(((1 + 2) * 3) - (4 - 3))',
    },
  ]
  for (const t of tests) {
    const lexer = new Lexer(t.input, context)
    const parser = new Parser(lexer, context)
    const program = parser.parse()
    expect(program.statements.length).toEqual(1)
    const statment = program.statements[0]
    expect(statment.type).toEqual('statement')
    expect(statment.statementType).toEqual('expression')
    const expression = statment.expression
    expect(formatExpression(expression)).toEqual(t.output)
  }
})
