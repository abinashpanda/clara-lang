export const TOKENS = {
  EOF: '',

  SEMI: ';',
  COMMA: ',',
  DOT: '.',
  DOT_DOT: '..',

  AND: 'and',
  OR: 'or',

  TRUE: 'true',
  FALSE: 'false',

  EQ: '=',
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

export type Token = {
  type: TokenType
  literal: string
  line: number // line number
  col: number // col number of the start of the token
}

export const LITERAL_TO_IDENT_MAP: Record<string, TokenType> = {
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
