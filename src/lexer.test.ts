import { test, expect } from 'bun:test'
import type { TokenType } from './token'
import { Lexer } from './lexer'

test('Lexer parses numbers correctly', () => {
  const input = '2 + 3.0 - 34.3;'
  const lexer = new Lexer(input)
  const expected: { type: TokenType; literal: string }[] = [
    { type: 'NUMBER', literal: '2' },
    { type: 'PLUS', literal: '+' },
    { type: 'NUMBER', literal: '3.0' },
    { type: 'MINUS', literal: '-' },
    { type: 'NUMBER', literal: '34.3' },
    { type: 'SEMI', literal: ';' },
    { type: 'EOF', literal: '' },
  ]
  for (const e of expected) {
    const token = lexer.next()
    expect(token.type).toEqual(e.type)
    expect(token.literal).toEqual(e.literal)
  }
})
