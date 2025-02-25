import { match } from 'ts-pattern'

export const TOKENS = {
  EOF: '',

  SEMI: ';',
  COLON: ':',
  COMMA: ',',
  DOT: '.',
  DOT_DOT: '..',

  AND: 'and',
  OR: 'or',

  BITWISE_AND: '&',
  BITWISE_OR: '|',
  BITWISE_XOR: '^',

  LEFT_SHIFT: '<<',
  RIGHT_SHIFT: '>>',

  TRUE: 'true',
  FALSE: 'false',

  EQ: '=',
  PLUS_EQ: '+=',
  MINUS_EQ: '-=',
  ASTERISK_EQ: '*=',
  SLASH_EQ: '/=',
  MODULUS_EQ: '%=',

  EQ_EQ: '==',
  NOT_EQ: '!=',
  GT: '>',
  GTE: '>=',
  LT: '<',
  LTE: '<=',
  BANG: '!',

  L_PAREN: '(',
  R_PAREN: ')',
  L_BRACE: '{',
  R_BRACE: '}',
  L_SQUARE: '[',
  R_SQUARE: ']',

  PLUS: '+',
  MINUS: '-',
  ASTERISK: '*',
  SLASH: '/',
  MODULUS: '%',
  EXPONENT: '**',

  IDENT: '<identifier>',
  LET: 'let',
  FUNCTION: 'fn',
  RETURN: 'return',
  MATCH: 'match',
  OTHERWISE: 'otherwise',
  IF: 'if',
  ELSE: 'else',
  FOR: 'for',
  BREAK: 'break',
  STRUCT: 'struct',
  TYPE: 'type',
  ENUM: 'enum',

  NUMBER_TYPE: 'number',
  STRING_TYPE: 'string',

  NUMBER: '<num>',
  STRING: '<string>',
} as const

export type TokenType = keyof typeof TOKENS

export function formatToken(tokenType: TokenType, literal?: string) {
  return match(tokenType)
    .returnType<string>()
    .with('NUMBER', () => `${literal} (NUMBER)`)
    .with('STRING', () => `"${literal}" (STRING)`)
    .otherwise(() => TOKENS[tokenType])
}

export type Token = {
  type: TokenType
  literal: string
  line: number // line number
  col: number // col number of the start of the token
}

export const LITERAL_TO_KEYWORD_MAP: Record<string, TokenType> = {
  let: 'LET',
  fn: 'FUNCTION',
  return: 'RETURN',
  match: 'MATCH',
  otherwise: 'OTHERWISE',
  if: 'IF',
  else: 'ELSE',
  for: 'FOR',
  break: 'BREAK',
  struct: 'STRUCT',
  type: 'TYPE',
  enum: 'ENUM',
  number: 'NUMBER_TYPE',
  string: 'STRING_TYPE',
  and: 'AND',
  or: 'OR',
  true: 'TRUE',
  false: 'FALSE',
} as const
