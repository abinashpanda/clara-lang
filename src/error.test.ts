import { test, expect } from 'bun:test'
import { createError, formatError } from './error'

test('Error formatter shows error at the correct place', () => {
  const input = 'let input 10;'
  const error = createError({
    line: 1,
    col: 11,
    message: 'expected =, got number',
    errorType: 'SyntaxError',
  })
  const formattedMessage = `
1  let input 10;
             ^^
SyntaxError: expected =, got number
`.trim()
  expect(formatError(input, error)).toEqual(formattedMessage)
})
