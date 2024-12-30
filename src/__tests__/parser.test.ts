import { test, expect } from 'bun:test'
import { Lexer } from '../lexer'
import { Parser } from '../parser'
import { formatExpression } from '../utils'
import { LangError } from '../error'
import chalk from 'chalk'
import type { ExpressionStatement } from '../ast'

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
      input: '(1 + 2) * 3',
      output: '((1 + 2) * 3)',
    },
    {
      input: '1 * 2 +2',
      output: '((1 * 2) + 2)',
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
    const lexer = new Lexer(t.input)
    const parser = new Parser(lexer, t.input)
    const program = parser.parse()
    expect(program.statements.length).toEqual(1)
    const statment = program.statements[0]
    expect(statment.type).toEqual('statement')
    expect(statment.statementType).toEqual('expression')
    const expression = (statment as ExpressionStatement).expression
    expect(formatExpression(expression)).toEqual(t.output)
  }
})

test('Parser parses let statement correctly', () => {
  const input = `let first_number: number = 2;\nlet second_number=3;`
  const lexer = new Lexer(input)
  const parser = new Parser(lexer, input)
  const program = parser.parse()
  expect(program.statements.length).toBe(2)
  const typedLetStatement = program.statements[0]
  expect(typedLetStatement).toEqual({
    type: 'statement',
    statementType: 'let',
    identifier: {
      type: 'expression',
      expressionType: 'ident',
      identifier: 'first_number',
    },
    expression: {
      type: 'expression',
      expressionType: 'primary',
      primaryType: 'number',
      value: 2,
    },
    typeDef: {
      type: 'typedef',
      defType: 'number',
    },
  })
})

test('Parser throws error correctly in parsing let statement', () => {
  const input = `let foo 10;`
  const lexer = new Lexer(input)
  const parser = new Parser(lexer, input)
  try {
    parser.parse()
  } catch (error) {
    expect(error).toBeInstanceOf(LangError)
    expect((error as LangError).message).toEqual(
      `
1 | let foo 10;
            ^^
${chalk.red('SyntaxError')}: expected =, got 10 (NUMBER)
`,
    )
  }
})

test('Parser parses return statement correctly', () => {
  const input = `return 10;    
return true;`
  const lexer = new Lexer(input)
  const parser = new Parser(lexer, input)
  const program = parser.parse()
  const statement = program.statements[0]
  expect(statement).toEqual({
    type: 'statement',
    statementType: 'return',
    expression: {
      type: 'expression',
      expressionType: 'primary',
      primaryType: 'number',
      value: 10,
    },
  })
})

test('Parser parses function statement correctly', () => {
  const input = `
fn sum(a: number, b: number): number {
  let sum_value = a + b;
  return sum_value;
}
`
  const lexer = new Lexer(input)
  const parser = new Parser(lexer, input)
  const program = parser.parse()
  const functionStatement = program.statements[0]
  expect(functionStatement.statementType).toEqual('function')
  expect(functionStatement).toEqual({
    type: 'statement',
    statementType: 'function',
    name: 'sum',
    parameters: [
      {
        type: 'parameter',
        identifier: {
          type: 'expression',
          expressionType: 'ident',
          identifier: 'a',
        },
        typeDef: {
          type: 'typedef',
          defType: 'number',
        },
      },
      {
        type: 'parameter',
        identifier: {
          type: 'expression',
          expressionType: 'ident',
          identifier: 'b',
        },
        typeDef: {
          type: 'typedef',
          defType: 'number',
        },
      },
    ],
    returnType: {
      type: 'typedef',
      defType: 'number',
    },
    body: [
      {
        type: 'statement',
        statementType: 'let',
        identifier: {
          type: 'expression',
          expressionType: 'ident',
          identifier: 'sum_value',
        },
        expression: {
          type: 'expression',
          expressionType: 'infix',
          operator: '+',
          left: {
            type: 'expression',
            expressionType: 'ident',
            identifier: 'a',
          },
          right: {
            type: 'expression',
            expressionType: 'ident',
            identifier: 'b',
          },
        },
      },
      {
        type: 'statement',
        statementType: 'return',
        expression: {
          type: 'expression',
          expressionType: 'ident',
          identifier: 'sum_value',
        },
      },
    ],
  })
})
