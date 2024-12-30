import { match, P } from 'ts-pattern'
import {
  OPERATOR_PREDENCE,
  Precedence,
  type Expression,
  type ExpressionStatement,
  type FunctionStatement,
  type LetStatement,
  type Parameter,
  type Program,
  type ReturnStatement,
  type Statement,
  type TypeDef,
} from './ast'
import type { Lexer } from './lexer'
import { formatToken, type Token, type TokenType } from './token'
import { invariant, type Nullable } from './utils'
import { createLangError, type ErrorType } from './error'

type ParsePrefixFn = () => Expression
type ParseInfixFn = (left: Expression) => Expression

export class Parser {
  private prefixFnMap: Partial<Record<TokenType, ParsePrefixFn>> = {}
  private infixFnMap: Partial<Record<TokenType, ParseInfixFn>> = {}

  constructor(
    private readonly lexer: Lexer,
    private readonly source: string,
    private curToken: Nullable<Token> = null,
    private peekToken: Nullable<Token> = null,
  ) {
    // initialize both curToken and nextToken
    this.nextToken()
    this.nextToken()

    this.registerParsePrefixFn('IDENT', this.parsePrimary.bind(this))
    this.registerParsePrefixFn('NUMBER', this.parsePrimary.bind(this))
    this.registerParsePrefixFn('STRING', this.parsePrimary.bind(this))
    this.registerParsePrefixFn('TRUE', this.parsePrimary.bind(this))
    this.registerParsePrefixFn('FALSE', this.parsePrimary.bind(this))
    this.registerParsePrefixFn('L_PAREN', this.parseGrouped.bind(this))

    this.registerParseInfixFn('EQ_EQ', this.parseInfixExpression.bind(this))
    this.registerParseInfixFn('NOT_EQ', this.parseInfixExpression.bind(this))
    this.registerParseInfixFn('GT', this.parseInfixExpression.bind(this))
    this.registerParseInfixFn('GTE', this.parseInfixExpression.bind(this))
    this.registerParseInfixFn('LT', this.parseInfixExpression.bind(this))
    this.registerParseInfixFn('LTE', this.parseInfixExpression.bind(this))
    this.registerParseInfixFn('AND', this.parseInfixExpression.bind(this))
    this.registerParseInfixFn('OR', this.parseInfixExpression.bind(this))
    this.registerParseInfixFn('PLUS', this.parseInfixExpression.bind(this))
    this.registerParseInfixFn('MINUS', this.parseInfixExpression.bind(this))
    this.registerParseInfixFn('ASTERISK', this.parseInfixExpression.bind(this))
    this.registerParseInfixFn('SLASH', this.parseInfixExpression.bind(this))
    this.registerParseInfixFn('MODULUS', this.parseInfixExpression.bind(this))
  }

  parse(): Program {
    const program: Program = { type: 'program', statements: [] }

    while (this.curToken !== null && this.curToken.type !== 'EOF') {
      const statement = this.parseStatement()
      if (statement !== null) {
        program.statements.push(statement)
      }
      this.nextToken()
    }

    return program
  }

  private parseStatement(): Nullable<Statement> {
    return match(this.curToken)
      .returnType<Nullable<Statement>>()
      .with({ type: 'LET' }, () => this.parseLetStatement())
      .with({ type: 'RETURN' }, () => this.parseReturnStatement())
      .with({ type: 'FUNCTION' }, () => this.parseFunctionStatement())
      .otherwise(() => {
        return this.parseExpressionStatement()
      })
  }

  private parseLetStatement(): LetStatement {
    this.nextToken()
    const ident = this.parsePrimary()
    if (!ident || ident.expressionType !== 'ident') {
      this.throwError(`expected identifier, got ${this.curToken?.type}`)
    }
    let typeDef: TypeDef | undefined
    if (this.peekToken?.type === 'COLON') {
      this.nextToken() // consume the current identifier token
      this.nextToken() // consume the colon token
      typeDef = this.parseTypeDef()
    }

    this.expectPeek('EQ')
    this.nextToken()
    const expression = this.parseExpression()

    this.expectPeek('SEMI')

    return {
      type: 'statement',
      statementType: 'let',
      identifier: ident,
      typeDef,
      expression,
    }
  }

  private parseReturnStatement(): ReturnStatement {
    this.nextToken()
    const expression = this.parseExpression()
    this.expectPeek('SEMI')
    return {
      type: 'statement',
      statementType: 'return',
      expression,
    }
  }

  private parseExpressionStatement(): ExpressionStatement {
    const expression = this.parseExpression()
    return {
      type: 'statement',
      statementType: 'expression',
      expression,
    }
  }

  private parseFunctionStatement(): FunctionStatement {
    this.expectPeek('IDENT')
    invariant(this.curToken, 'curToken would be present')
    const name = this.curToken.literal

    this.expectPeek('L_PAREN')
    this.nextToken()

    const parameters: Parameter[] = []
    while (!['R_PAREN', 'EOF'].includes(this.curToken.type)) {
      this.expectCurrent('IDENT')
      const identifier = this.parsePrimary()
      invariant(
        identifier.expressionType === 'ident',
        'it should be an identifier',
      )
      this.expectPeek('COLON')
      this.nextToken()
      const typeDef = this.parseTypeDef()
      parameters.push({
        type: 'parameter',
        identifier,
        typeDef,
      })

      if (this.peekToken?.type === 'COMMA') {
        this.nextToken()
      }

      this.nextToken()
    }

    this.expectPeek('COLON')
    this.nextToken()
    const returnType = this.parseTypeDef()

    this.expectPeek('L_BRACE')
    this.nextToken()

    const body: Statement[] = []
    while (!['EOF', 'R_BRACE'].includes(this.curToken.type)) {
      const statment = this.parseStatement()
      if (statment) {
        body.push(statment)
      }
      this.nextToken()
    }

    return {
      type: 'statement',
      statementType: 'function',
      returnType,
      name,
      parameters,
      body,
    }
  }

  private parseExpression(
    precedence: Precedence = Precedence.LOWEST,
  ): Expression {
    invariant(this.curToken, 'curToken should be present')
    const parsePrefixFn = this.prefixFnMap[this.curToken.type]
    if (!parsePrefixFn) {
      this.throwError(
        `no parse prefix function found for tokenType ${this.curToken.type}`,
        'SyntaxError',
      )
    }

    let left = parsePrefixFn()

    while (
      this.curToken.type !== 'SEMI' &&
      precedence < this.peekPrecedence()
    ) {
      invariant(this.peekToken, 'peek token is present')
      const parseInfixFn = this.infixFnMap[this.peekToken?.type]
      if (!parseInfixFn) {
        return left
      }
      this.nextToken()
      left = parseInfixFn(left)
    }

    return left
  }

  private parsePrimary() {
    const expression = match(this.curToken)
      .returnType<Expression>()
      .with({ type: 'IDENT' }, ({ literal }) => ({
        type: 'expression',
        expressionType: 'ident',
        identifier: literal,
      }))
      .with({ type: 'NUMBER' }, ({ literal }) => {
        const value = Number.parseFloat(literal)
        if (Number.isNaN(value)) {
          this.throwError('invalid number type', 'SyntaxError')
        }
        return {
          type: 'expression',
          expressionType: 'primary',
          primaryType: 'number',
          value,
        }
      })
      .with({ type: 'STRING' }, ({ literal }) => {
        return {
          type: 'expression',
          expressionType: 'primary',
          primaryType: 'string',
          value: literal,
        }
      })
      .with(P.union({ type: 'TRUE' }, { type: 'FALSE' }), ({ literal }) => {
        return {
          type: 'expression',
          expressionType: 'primary',
          primaryType: 'boolean',
          value: literal === 'true',
        }
      })
      .run()

    return expression
  }

  private parseTypeDef(): TypeDef {
    return match(this.curToken)
      .returnType<TypeDef>()
      .with({ type: 'NUMBER_TYPE' }, () => ({
        type: 'typedef',
        defType: 'number',
      }))
      .with({ type: 'STRING_TYPE' }, () => ({
        type: 'typedef',
        defType: 'string',
      }))
      .otherwise(() => {
        this.throwError(`expected type, got ${this.curToken?.type}`)
      })
  }

  private parseInfixExpression(left: Expression): Expression {
    invariant(this.curToken, 'curToken should be present')

    const precedence = this.curPrecedence()
    const operator = this.curToken.literal
    this.nextToken()
    const right = this.parseExpression(precedence)
    return {
      type: 'expression',
      expressionType: 'infix',
      operator,
      left,
      right,
    }
  }

  private parseGrouped() {
    this.nextToken()
    const expression = this.parseExpression(Precedence.LOWEST)
    this.expectPeek('R_PAREN')
    return expression
  }

  private nextToken() {
    this.curToken = this.peekToken
    this.peekToken = this.lexer.next()
  }

  private registerParsePrefixFn(tokenType: TokenType, fn: ParsePrefixFn) {
    this.prefixFnMap[tokenType] = fn
  }

  private registerParseInfixFn(tokenType: TokenType, fn: ParseInfixFn) {
    this.infixFnMap[tokenType] = fn
  }

  private curPrecedence() {
    invariant(this.curToken, 'current token should be present')
    return OPERATOR_PREDENCE[this.curToken.type] ?? Precedence.LOWEST
  }

  private peekPrecedence() {
    invariant(this.peekToken, 'peek token should be present')
    return OPERATOR_PREDENCE[this.peekToken?.type] ?? Precedence.LOWEST
  }

  private expectPeek(tokenType: TokenType) {
    if (this.peekToken?.type !== tokenType) {
      invariant(this.peekToken, 'peekToken should be present')
      throw createLangError({
        col: this.peekToken?.col,
        line: this.peekToken?.line,
        message: `expected ${formatToken(tokenType)}, got ${formatToken(this.peekToken?.type, this.peekToken.literal)}`,
        errorType: 'SyntaxError',
        src: this.source,
      })
    }
    this.nextToken()
  }

  private expectCurrent(tokenType: TokenType) {
    if (this.curToken?.type !== tokenType) {
      invariant(this.curToken, 'curToken should be present')
      throw createLangError({
        col: this.curToken?.col,
        line: this.curToken?.line,
        message: `expected ${formatToken(tokenType)}, got ${formatToken(this.curToken?.type, this.curToken.literal)}`,
        errorType: 'SyntaxError',
        src: this.source,
      })
    }
  }

  private throwError(
    message: string,
    errorType: ErrorType = 'SyntaxError',
  ): never {
    invariant(this.curToken, 'curToken should be present')
    throw createLangError({
      col: this.curToken?.col,
      line: this.curToken?.line,
      message,
      errorType,
      src: this.source,
    })
  }
}
