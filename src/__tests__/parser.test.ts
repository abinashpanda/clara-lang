import { test, expect } from 'bun:test'
import { Lexer } from '../lexer'
import { Parser } from '../parser'
import { formatExpression } from '../formatter'
import { LangError } from '../error'
import chalk from 'chalk'
import type { ExpressionStatement, Program } from '../ast'

test('Parser parses expression statement correctly', () => {
  const tests: { input: string; output: string }[] = [
    {
      input: '2 + 3;',
      output: '(2 + 3)',
    },
    {
      input: '1 + 2 * 3;',
      output: '(1 + (2 * 3))',
    },
    {
      input: '(1 + 2) * 3;',
      output: '((1 + 2) * 3)',
    },
    {
      input: '1 * 2 +2;',
      output: '((1 * 2) + 2)',
    },
    {
      input: '1 + 2 * 3 - 4;',
      output: '((1 + (2 * 3)) - 4)',
    },
    {
      input: '(1 + 2) * 3 - (4 - 3);',
      output: '(((1 + 2) * 3) - (4 - 3))',
    },
    {
      input: 'sum(1, 2);',
      output: 'sum(1, 2)',
    },
    {
      input: 'sum(diff(1, 2), 3 * 3 + invert(false));',
      output: 'sum(diff(1, 2), ((3 * 3) + invert(false)))',
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
${chalk.red('SyntaxError')}: expected ${chalk.green('=')} got ${chalk.yellow('10 (NUMBER)')}
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
let sum_of_nums = sum(1, 2);
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
    body: {
      type: 'statement',
      statementType: 'block',
      statements: [
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
    },
  })
  const letStatement = program.statements[1]
  expect(letStatement).toEqual({
    type: 'statement',
    statementType: 'let',
    identifier: {
      type: 'expression',
      expressionType: 'ident',
      identifier: 'sum_of_nums',
    },
    expression: {
      type: 'expression',
      expressionType: 'call',
      functionName: 'sum',
      args: [
        {
          type: 'expression',
          expressionType: 'primary',
          primaryType: 'number',
          value: 1,
        },
        {
          type: 'expression',
          expressionType: 'primary',
          primaryType: 'number',
          value: 2,
        },
      ],
    },
  })
})

test('Parser parses if statement correctly', () => {
  const input = `
if (sum < 100) {
  print(sum);
}
`
  const lexer = new Lexer(input)
  const parser = new Parser(lexer, input)
  const program = parser.parse()
  const ifStatement = program.statements[0]
  expect(ifStatement).toEqual({
    type: 'statement',
    statementType: 'if',
    test: {
      type: 'expression',
      expressionType: 'infix',
      operator: '<',
      left: {
        type: 'expression',
        expressionType: 'ident',
        identifier: 'sum',
      },
      right: {
        type: 'expression',
        expressionType: 'primary',
        primaryType: 'number',
        value: 100,
      },
    },
    consequence: {
      type: 'statement',
      statementType: 'block',
      statements: [
        {
          type: 'statement',
          statementType: 'expression',
          expression: {
            type: 'expression',
            expressionType: 'call',
            functionName: 'print',
            args: [
              {
                type: 'expression',
                expressionType: 'ident',
                identifier: 'sum',
              },
            ],
          },
        },
      ],
    },
  })
})

test('Parser parses if, else statement correctly', () => {
  const input = `
if (sum < 2) {
  print("sum is less than 2");
} else {
  print("sum is greater than 2");
}
let value = 2;
`
  const lexer = new Lexer(input)
  const parser = new Parser(lexer, input)
  const program = parser.parse()
  const ifStatement = program.statements[0]
  expect(ifStatement).toEqual({
    type: 'statement',
    statementType: 'if',
    test: {
      type: 'expression',
      expressionType: 'infix',
      operator: '<',
      left: {
        type: 'expression',
        expressionType: 'ident',
        identifier: 'sum',
      },
      right: {
        type: 'expression',
        expressionType: 'primary',
        primaryType: 'number',
        value: 2,
      },
    },
    consequence: {
      type: 'statement',
      statementType: 'block',
      statements: [
        {
          type: 'statement',
          statementType: 'expression',
          expression: {
            type: 'expression',
            expressionType: 'call',
            functionName: 'print',
            args: [
              {
                type: 'expression',
                expressionType: 'primary',
                primaryType: 'string',
                value: 'sum is less than 2',
              },
            ],
          },
        },
      ],
    },
    alternate: {
      type: 'statement',
      statementType: 'block',
      statements: [
        {
          type: 'statement',
          statementType: 'expression',
          expression: {
            type: 'expression',
            expressionType: 'call',
            functionName: 'print',
            args: [
              {
                type: 'expression',
                expressionType: 'primary',
                primaryType: 'string',
                value: 'sum is greater than 2',
              },
            ],
          },
        },
      ],
    },
  })
})

test('Parser parses assignment expressions correctly', () => {
  const tests: { input: string; output: string }[] = [
    {
      input: 'sum = 2 + 3;',
      output: '(sum = (2 + 3))',
    },
    {
      input: 'diff = first_number - second_number;',
      output: '(diff = (first_number - second_number))',
    },
    {
      input: 'product *= 3 + 4 / 5;',
      output: '(product *= (3 + (4 / 5)))',
    },
    {
      input: 'division /= 2;',
      output: '(division /= 2)',
    },
    {
      input: 'modulus %= 4 / 4 + 4;',
      output: '(modulus %= ((4 / 4) + 4))',
    },
  ]
  for (const test of tests) {
    const lexer = new Lexer(test.input)
    const parser = new Parser(lexer, test.input)
    const program = parser.parse()
    expect(program.statements.length).toBe(1)
    const expressionStatement = program.statements[0]
    expect(expressionStatement.statementType).toBe('expression')
    const output = formatExpression(
      (expressionStatement as ExpressionStatement).expression,
    )
    expect(output).toEqual(test.output)
  }
})

test('Parser parses for expression correctly', () => {
  const tests: { input: string; program: Program }[] = [
    {
      input: `
    for (let i = 0; i < 10; i += 1) {
      print(i);
    }
    `,
      program: {
        type: 'program',
        statements: [
          {
            type: 'statement',
            statementType: 'for',
            init: {
              type: 'statement',
              statementType: 'let',
              identifier: {
                type: 'expression',
                expressionType: 'ident',
                identifier: 'i',
              },
              expression: {
                type: 'expression',
                expressionType: 'primary',
                primaryType: 'number',
                value: 0,
              },
            },
            test: {
              type: 'expression',
              expressionType: 'infix',
              operator: '<',
              left: {
                type: 'expression',
                expressionType: 'ident',
                identifier: 'i',
              },
              right: {
                type: 'expression',
                expressionType: 'primary',
                primaryType: 'number',
                value: 10,
              },
            },
            post: {
              type: 'expression',
              expressionType: 'infix',
              operator: '+=',
              left: {
                type: 'expression',
                expressionType: 'ident',
                identifier: 'i',
              },
              right: {
                type: 'expression',
                expressionType: 'primary',
                primaryType: 'number',
                value: 1,
              },
            },
            body: {
              type: 'statement',
              statementType: 'block',
              statements: [
                {
                  type: 'statement',
                  statementType: 'expression',
                  expression: {
                    type: 'expression',
                    expressionType: 'call',
                    functionName: 'print',
                    args: [
                      {
                        type: 'expression',
                        expressionType: 'ident',
                        identifier: 'i',
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      input: `
        let i = 0;
        for (i = 10; i < 50; i *= 2) {
          print(i * 2);
        }
        `,
      program: {
        type: 'program',
        statements: [
          {
            type: 'statement',
            statementType: 'let',
            identifier: {
              type: 'expression',
              expressionType: 'ident',
              identifier: 'i',
            },
            expression: {
              type: 'expression',
              expressionType: 'primary',
              primaryType: 'number',
              value: 0,
            },
          },
          {
            type: 'statement',
            statementType: 'for',
            init: {
              type: 'expression',
              expressionType: 'infix',
              operator: '=',
              left: {
                type: 'expression',
                expressionType: 'ident',
                identifier: 'i',
              },
              right: {
                type: 'expression',
                expressionType: 'primary',
                primaryType: 'number',
                value: 10,
              },
            },
            test: {
              type: 'expression',
              expressionType: 'infix',
              operator: '<',
              left: {
                type: 'expression',
                expressionType: 'ident',
                identifier: 'i',
              },
              right: {
                type: 'expression',
                expressionType: 'primary',
                primaryType: 'number',
                value: 50,
              },
            },
            post: {
              type: 'expression',
              expressionType: 'infix',
              operator: '*=',
              left: {
                type: 'expression',
                expressionType: 'ident',
                identifier: 'i',
              },
              right: {
                type: 'expression',
                expressionType: 'primary',
                primaryType: 'number',
                value: 2,
              },
            },
            body: {
              type: 'statement',
              statementType: 'block',
              statements: [
                {
                  type: 'statement',
                  statementType: 'expression',
                  expression: {
                    type: 'expression',
                    expressionType: 'call',
                    functionName: 'print',
                    args: [
                      {
                        type: 'expression',
                        expressionType: 'infix',
                        operator: '*',
                        left: {
                          type: 'expression',
                          expressionType: 'ident',
                          identifier: 'i',
                        },
                        right: {
                          type: 'expression',
                          expressionType: 'primary',
                          primaryType: 'number',
                          value: 2,
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      input: `
        let i = 0;
        for (i = 10; i < 50; i *= 2) {
          if (i < 40) {
            break;
          }
          print(i * 2);
        }
        `,
      program: {
        type: 'program',
        statements: [
          {
            type: 'statement',
            statementType: 'let',
            identifier: {
              type: 'expression',
              expressionType: 'ident',
              identifier: 'i',
            },
            expression: {
              type: 'expression',
              expressionType: 'primary',
              primaryType: 'number',
              value: 0,
            },
          },
          {
            type: 'statement',
            statementType: 'for',
            init: {
              type: 'expression',
              expressionType: 'infix',
              operator: '=',
              left: {
                type: 'expression',
                expressionType: 'ident',
                identifier: 'i',
              },
              right: {
                type: 'expression',
                expressionType: 'primary',
                primaryType: 'number',
                value: 10,
              },
            },
            test: {
              type: 'expression',
              expressionType: 'infix',
              operator: '<',
              left: {
                type: 'expression',
                expressionType: 'ident',
                identifier: 'i',
              },
              right: {
                type: 'expression',
                expressionType: 'primary',
                primaryType: 'number',
                value: 50,
              },
            },
            post: {
              type: 'expression',
              expressionType: 'infix',
              operator: '*=',
              left: {
                type: 'expression',
                expressionType: 'ident',
                identifier: 'i',
              },
              right: {
                type: 'expression',
                expressionType: 'primary',
                primaryType: 'number',
                value: 2,
              },
            },
            body: {
              type: 'statement',
              statementType: 'block',
              statements: [
                {
                  type: 'statement',
                  statementType: 'if',
                  test: {
                    type: 'expression',
                    expressionType: 'infix',
                    operator: '<',
                    left: {
                      type: 'expression',
                      expressionType: 'ident',
                      identifier: 'i',
                    },
                    right: {
                      type: 'expression',
                      expressionType: 'primary',
                      primaryType: 'number',
                      value: 40,
                    },
                  },
                  consequence: {
                    type: 'statement',
                    statementType: 'block',
                    statements: [
                      {
                        type: 'statement',
                        statementType: 'break',
                      },
                    ],
                  },
                },
                {
                  type: 'statement',
                  statementType: 'expression',
                  expression: {
                    type: 'expression',
                    expressionType: 'call',
                    functionName: 'print',
                    args: [
                      {
                        type: 'expression',
                        expressionType: 'infix',
                        operator: '*',
                        left: {
                          type: 'expression',
                          expressionType: 'ident',
                          identifier: 'i',
                        },
                        right: {
                          type: 'expression',
                          expressionType: 'primary',
                          primaryType: 'number',
                          value: 2,
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      input: `
    let sum = 1;
    # a for loop without any initialization, test or post, would be
    # equaivalent to while(true) in other programming language
    for {
      sum += 1;
      if (sum > 100) {
        break;
      }
    }
    print(sum);
    `,
      program: {
        type: 'program',
        statements: [
          {
            type: 'statement',
            statementType: 'let',
            identifier: {
              type: 'expression',
              expressionType: 'ident',
              identifier: 'sum',
            },
            expression: {
              type: 'expression',
              expressionType: 'primary',
              primaryType: 'number',
              value: 1,
            },
          },
          {
            type: 'statement',
            statementType: 'for',
            body: {
              type: 'statement',
              statementType: 'block',
              statements: [
                {
                  type: 'statement',
                  statementType: 'expression',
                  expression: {
                    type: 'expression',
                    expressionType: 'infix',
                    operator: '+=',
                    left: {
                      type: 'expression',
                      expressionType: 'ident',
                      identifier: 'sum',
                    },
                    right: {
                      type: 'expression',
                      expressionType: 'primary',
                      primaryType: 'number',
                      value: 1,
                    },
                  },
                },
                {
                  type: 'statement',
                  statementType: 'if',
                  test: {
                    type: 'expression',
                    expressionType: 'infix',
                    operator: '>',
                    left: {
                      type: 'expression',
                      expressionType: 'ident',
                      identifier: 'sum',
                    },
                    right: {
                      type: 'expression',
                      expressionType: 'primary',
                      primaryType: 'number',
                      value: 100,
                    },
                  },
                  consequence: {
                    type: 'statement',
                    statementType: 'block',
                    statements: [
                      {
                        type: 'statement',
                        statementType: 'break',
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            type: 'statement',
            statementType: 'expression',
            expression: {
              type: 'expression',
              expressionType: 'call',
              functionName: 'print',
              args: [
                {
                  type: 'expression',
                  expressionType: 'ident',
                  identifier: 'sum',
                },
              ],
            },
          },
        ],
      },
    },
  ]
  for (const test of tests) {
    const lexer = new Lexer(test.input)
    const parser = new Parser(lexer, test.input)
    const program = parser.parse()
    expect(program).toEqual(test.program)
  }
})
