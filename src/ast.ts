import type { TokenType } from './token'

export type BaseExpression = {
  type: 'expression'
}

export type IdentExpression = BaseExpression & {
  expressionType: 'ident'
  identifier: string
}

export type PrimaryExpression = BaseExpression & {
  expressionType: 'primary'
} & (
    | { primaryType: 'string'; value: string }
    | { primaryType: 'number'; value: number }
    | { primaryType: 'boolean'; value: boolean }
  )

export type InfixExpression = BaseExpression & {
  expressionType: 'infix'
  operator: string
  left: Expression
  right: Expression
}

export type PrefixExpression = BaseExpression & {
  expressionType: 'prefix'
  operator: string
  right: Expression
}

export type Expression =
  | IdentExpression
  | PrimaryExpression
  | InfixExpression
  | PrefixExpression

export type BaseStatement = {
  type: 'statement'
}

export type ExpressionStatement = BaseStatement & {
  statementType: 'expression'
  expression: Expression
}

export type Statement = ExpressionStatement

export type Program = {
  type: 'program'
  statements: Statement[]
}

export enum Precedence {
  LOWEST = 0,
  LOGICAL,
  SUM,
  PRODUCT,
  PRIMARY,
}

export const OPERATOR_PREDENCE: Partial<Record<TokenType, Precedence>> = {
  EQ_EQ: Precedence.LOGICAL,
  NOT_EQ: Precedence.LOGICAL,
  GT: Precedence.LOGICAL,
  GTE: Precedence.LOGICAL,
  LT: Precedence.LOGICAL,
  LTE: Precedence.LOGICAL,
  PLUS: Precedence.SUM,
  MINUS: Precedence.SUM,
  ASTERISK: Precedence.PRODUCT,
  SLASH: Precedence.PRODUCT,
  MODULUS: Precedence.PRODUCT,
  IDENT: Precedence.PRIMARY,
  STRING: Precedence.PRIMARY,
  NUMBER: Precedence.PRIMARY,
}
