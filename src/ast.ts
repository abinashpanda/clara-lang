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
  callee: Identifier | CallExpression
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
  BITWISE,
  EQUALITY,
  RELATIONAL,
  BITWISE_SHIFT,
  SUM,
  PRODUCT,
  EXPONENT,
  PRIMARY,
}

export const OPERATOR_PREDENCE: Partial<Record<TokenType, Precedence>> = {
  EQ: Precedence.ASSIGNMENT,
  PLUS_EQ: Precedence.ASSIGNMENT,
  MINUS_EQ: Precedence.ASSIGNMENT,
  ASTERISK_EQ: Precedence.ASSIGNMENT,
  SLASH_EQ: Precedence.ASSIGNMENT,
  MODULUS_EQ: Precedence.ASSIGNMENT,

  OR: Precedence.LOGICAL,
  AND: Precedence.LOGICAL,

  BITWISE_AND: Precedence.BITWISE,
  BITWISE_OR: Precedence.BITWISE,
  BITWISE_XOR: Precedence.BITWISE,

  EQ_EQ: Precedence.EQUALITY,
  NOT_EQ: Precedence.EQUALITY,

  GT: Precedence.RELATIONAL,
  GTE: Precedence.RELATIONAL,
  LT: Precedence.RELATIONAL,
  LTE: Precedence.RELATIONAL,

  LEFT_SHIFT: Precedence.BITWISE_SHIFT,
  RIGHT_SHIFT: Precedence.BITWISE_SHIFT,

  PLUS: Precedence.SUM,
  MINUS: Precedence.SUM,

  ASTERISK: Precedence.PRODUCT,
  SLASH: Precedence.PRODUCT,
  MODULUS: Precedence.PRODUCT,

  EXPONENT: Precedence.EXPONENT,

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
  test?: Expression
  post?: Expression
  body: BlockStatement
}

export type BreakStatement = BaseStatement & {
  statementType: 'break'
}

export type TypeDefStatement = BaseStatement & {
  statementType: 'typedef'
  identifier: Identifier
  typeDef: TypeDef
}

export type Statement =
  | ExpressionStatement
  | LetStatement
  | ReturnStatement
  | BlockStatement
  | FunctionStatement
  | IfStatement
  | ForStatement
  | BreakStatement
  | TypeDefStatement

export type BaseTypeDef = {
  type: 'typedef'
}

export type StringTypeDef = BaseTypeDef & {
  defType: 'string'
}

export type NumberTypeDef = BaseTypeDef & {
  defType: 'number'
}

export type CustomTypeDef = BaseTypeDef & {
  defType: 'custom'
  identifier: Identifier
}

export type TypeDef = StringTypeDef | NumberTypeDef | CustomTypeDef

export type Program = {
  type: 'program'
  statements: Statement[]
}
