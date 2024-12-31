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

export type CallExpression = BaseExpression & {
  expressionType: 'call'
  functionName: string
  args: Expression[]
}

export type Expression =
  | Identifier
  | PrimaryExpression
  | InfixExpression
  | PrefixExpression
  | CallExpression

export enum Precedence {
  LOWEST = 0,
  ASSIGNMENT,
  LOGICAL,
  SUM,
  PRODUCT,
  PRIMARY,
}

export const OPERATOR_PREDENCE: Partial<Record<TokenType, Precedence>> = {
  EQ: Precedence.ASSIGNMENT,
  PLUS_EQ: Precedence.ASSIGNMENT,
  MINUS_EQ: Precedence.ASSIGNMENT,
  ASTERISK_EQ: Precedence.ASSIGNMENT,
  SLASH_EQ: Precedence.ASSIGNMENT,
  MODULUS_EQ: Precedence.ASSIGNMENT,

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

export type BlockStatement = BaseStatement & {
  statementType: 'block'
  statements: Statement[]
}

export type FunctionStatement = BaseStatement & {
  statementType: 'function'
  name: string
  parameters: Parameter[]
  returnType: TypeDef
  body: BlockStatement
}

export type Parameter = {
  type: 'parameter'
  identifier: Identifier
  typeDef: TypeDef
  defaultValue?: PrimaryExpression
}

export type IfStatement = BaseStatement & {
  statementType: 'if'
  test: Expression
  consequence: BlockStatement
  alternate?: BlockStatement
}

export type ForStatement = BaseStatement & {
  statementType: 'for'
  init?: Expression | LetStatement
  test: Expression
  post?: Expression
  body: BlockStatement
}

export type Statement =
  | ExpressionStatement
  | LetStatement
  | ReturnStatement
  | BlockStatement
  | FunctionStatement
  | IfStatement
  | ForStatement

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
