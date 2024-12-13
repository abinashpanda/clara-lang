export type BaseExpression = {
  type: 'expression'
}

export type Primary = number | string

export type PrimaryExpression = BaseExpression & {
  expressionType: 'primary'
  value: Primary
}

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

export type Expression = PrimaryExpression | InfixExpression | PrefixExpression

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
