import { test, expect } from 'bun:test'
import { createLangError } from '../error'
import chalk from 'chalk'

test('Error formatter shows error at the correct place', () => {
  const input = 'let input 10;'
  const error = createLangError({
    line: 1,
    col: 11,
    message: 'expected =, got number',
    errorType: 'SyntaxError',
    src: input,
  })
  const formattedMessage = `
1 | let input 10;
              ^^
${chalk.red('SyntaxError')}: expected =, got number
`
  expect(error.message).toEqual(formattedMessage)
})

test('Error formatted shows error correctly in multiline', () => {
  const input = `let first_variable = 20.2;
# non-formatted code
let second_variable   = 3.14   ;

fn sum(a: number, b: number): 10 
  return a + b;
}

fn main() {
  let first_number: number = 10;
  let second_number: number = 20;
  let sum_of_numbers: number = sum(a, b);
  print(sum_of_numbers);
}`
  const error = createLangError({
    line: 5,
    col: 31,
    errorType: 'SyntaxError',
    message: 'expected type, got number',
    src: input,
  })
  const formattedError = `
5 | fn sum(a: number, b: number): 10 
                                  ^^
${chalk.red('SyntaxError')}: expected type, got number
`
  expect(error.message).toEqual(formattedError)
})
