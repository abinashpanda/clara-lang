import type { TokenType } from './token'

export type BaseExpression = {
  type: 'expression'
}

export type Identifier = BaseExpression & {
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
  | Identifier
  | PrimaryExpression
  | InfixExpression
  | PrefixExpression

export enum Precedence {
  LOWEST = 0,
  LOGICAL,
  SUM,
  PRODUCT,
  CALL,
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

export type BaseStatement = {
  type: 'statement'
}

export type ExpressionStatement = BaseStatement & {
  statementType: 'expression'
  expression: Expression
}

export type LetStatement = BaseStatement & {
  statementType: 'let'
  identifier: Identifier
  typeDef?: TypeDef
  expression: Expression
}

export type ReturnStatement = BaseStatement & {
  statementType: 'return'
  expression: Expression
}

export type FunctionStatement = BaseStatement & {
  statementType: 'function'
  name: string
  parameters: Param[]
  returnType: TypeDef
  body: Statement[]
}

export type Parameter = {
  type: 'parameter'
  identifier: Identifier
  typeDef: TypeDef
  defaultValue?: PrimaryExpression
}

export type Statement =
  | ExpressionStatement
  | LetStatement
  | ReturnStatement
  | FunctionStatement

export type BaseTypeDef = {
  type: 'typedef'
}

export type StringTypeDef = BaseTypeDef & {
  defType: 'string'
}

export type NumberTypeDef = BaseTypeDef & {
  defType: 'number'
}

export type TypeDef = StringTypeDef | NumberTypeDef

export type Program = {
  type: 'program'
  statements: Statement[]
}
