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

test('Lexer skips single line comments correctly', () => {
  const input = `# single line comment`
  const lexer = new Lexer(input)
  const token = lexer.next()
  expect(token.type).toEqual('EOF')
})

test('Lexer skips multi line comments correctly', () => {
  const input = `
    # first line comment
# impropertly formatted second line comment
let foo = 21; # some other comment
# other comment
`
  const lexer = new Lexer(input)
  const expected: { tokenType: TokenType; literal: string }[] = [
    { tokenType: 'LET', literal: 'let' },
    { tokenType: 'IDENT', literal: 'foo' },
    { tokenType: 'EQ', literal: '=' },
    { tokenType: 'NUMBER', literal: '21' },
    { tokenType: 'SEMI', literal: ';' },
    { tokenType: 'EOF', literal: '' },
  ]
  for (const e of expected) {
    const token = lexer.next()
    expect(token.type).toEqual(e.tokenType)
    expect(token.literal).toEndWith(e.literal)
  }
})

test('Lexer parses identifiers and keywords correctly', () => {
  const input = `let first_variable = 20.2;
# non-formatted code
let second_variable   = 3.14   ;

fn sum(a: number, b: number): number {
  return a + b;
}

fn main() {
  let first_number: number = 10;
  let second_number: number = 20;
  let sum_of_numbers: number = sum(a, b);
  print(sum_of_numbers);
}
`
  const lexer = new Lexer(input)
  const expected: { tokenType: TokenType; literal: string }[] = [
    { tokenType: 'LET', literal: 'let' },
    { tokenType: 'IDENT', literal: 'first_variable' },
    { tokenType: 'EQ', literal: '=' },
    { tokenType: 'NUMBER', literal: '20.2' },
    { tokenType: 'SEMI', literal: ';' },
    { tokenType: 'LET', literal: 'let' },
    { tokenType: 'IDENT', literal: 'second_variable' },
    { tokenType: 'EQ', literal: '=' },
    { tokenType: 'NUMBER', literal: '3.14' },
    { tokenType: 'SEMI', literal: ';' },
    { tokenType: 'FUNCTION', literal: 'fn' },
    { tokenType: 'IDENT', literal: 'sum' },
    { tokenType: 'L_PAREN', literal: '(' },
    { tokenType: 'IDENT', literal: 'a' },
    { tokenType: 'COLON', literal: ':' },
    { tokenType: 'NUMBER_TYPE', literal: 'number' },
    { tokenType: 'COMMA', literal: ',' },
    { tokenType: 'IDENT', literal: 'b' },
    { tokenType: 'COLON', literal: ':' },
    { tokenType: 'NUMBER_TYPE', literal: 'number' },
    { tokenType: 'R_PAREN', literal: ')' },
    { tokenType: 'COLON', literal: ':' },
    { tokenType: 'NUMBER_TYPE', literal: 'number' },
    { tokenType: 'L_BRACE', literal: '{' },
    { tokenType: 'RETURN', literal: 'return' },
    { tokenType: 'IDENT', literal: 'a' },
    { tokenType: 'PLUS', literal: '+' },
    { tokenType: 'IDENT', literal: 'b' },
    { tokenType: 'SEMI', literal: ';' },
    { tokenType: 'R_BRACE', literal: '}' },
    { tokenType: 'FUNCTION', literal: 'fn' },
    { tokenType: 'IDENT', literal: 'main' },
    { tokenType: 'L_PAREN', literal: '(' },
    { tokenType: 'R_PAREN', literal: ')' },
    { tokenType: 'L_BRACE', literal: '{' },
  ]
  for (const e of expected) {
    const token = lexer.next()
    expect(token.type).toEqual(e.tokenType)
    expect(token.literal).toEqual(e.literal)
  }
})
