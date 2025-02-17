import { match, P } from 'ts-pattern'
import {
  OPERATOR_PREDENCE,
  Precedence,
  type BlockStatement,
  type BreakStatement,
  type Expression,
  type ExpressionStatement,
  type ForStatement,
  type FunctionStatement,
  type IfStatement,
  type LetStatement,
  type Parameter,
  type Program,
  type ReturnStatement,
  type Statement,
  type TypeDef,
} from './ast'
import type { Lexer } from './lexer'
import { formatToken, type Token, type TokenType } from './token'
import { type Nullable } from './utils'
import { createLangError, type ErrorType } from './error'
import chalk from 'chalk'

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

    this.registerParsePrefixFn('IDENT', this.parseIdent.bind(this))
    this.registerParsePrefixFn('NUMBER', this.parsePrimary.bind(this))
    this.registerParsePrefixFn('STRING', this.parsePrimary.bind(this))
    this.registerParsePrefixFn('TRUE', this.parsePrimary.bind(this))
    this.registerParsePrefixFn('FALSE', this.parsePrimary.bind(this))
    this.registerParsePrefixFn('L_PAREN', this.parseGrouped.bind(this))

    this.registerParseInfixFn('EQ', this.parseInfixExpression.bind(this))
    this.registerParseInfixFn('PLUS_EQ', this.parseInfixExpression.bind(this))
    this.registerParseInfixFn('MINUS_EQ', this.parseInfixExpression.bind(this))
    this.registerParseInfixFn(
      'ASTERISK_EQ',
      this.parseInfixExpression.bind(this),
    )
    this.registerParseInfixFn('SLASH_EQ', this.parseInfixExpression.bind(this))
    this.registerParseInfixFn(
      'MODULUS_EQ',
      this.parseInfixExpression.bind(this),
    )

    this.registerParseInfixFn('OR', this.parseInfixExpression.bind(this))
    this.registerParseInfixFn('AND', this.parseInfixExpression.bind(this))

    this.registerParseInfixFn(
      'BITWISE_AND',
      this.parseInfixExpression.bind(this),
    )
    this.registerParseInfixFn(
      'BITWISE_OR',
      this.parseInfixExpression.bind(this),
    )
    this.registerParseInfixFn(
      'BITWISE_XOR',
      this.parseInfixExpression.bind(this),
    )

    this.registerParseInfixFn('EQ_EQ', this.parseInfixExpression.bind(this))
    this.registerParseInfixFn('NOT_EQ', this.parseInfixExpression.bind(this))

    this.registerParseInfixFn('GT', this.parseInfixExpression.bind(this))
    this.registerParseInfixFn('GTE', this.parseInfixExpression.bind(this))
    this.registerParseInfixFn('LT', this.parseInfixExpression.bind(this))
    this.registerParseInfixFn('LTE', this.parseInfixExpression.bind(this))

    this.registerParseInfixFn(
      'LEFT_SHIFT',
      this.parseInfixExpression.bind(this),
    )
    this.registerParseInfixFn(
      'RIGHT_SHIFT',
      this.parseInfixExpression.bind(this),
    )

    this.registerParseInfixFn('PLUS', this.parseInfixExpression.bind(this))
    this.registerParseInfixFn('MINUS', this.parseInfixExpression.bind(this))

    this.registerParseInfixFn('ASTERISK', this.parseInfixExpression.bind(this))
    this.registerParseInfixFn('SLASH', this.parseInfixExpression.bind(this))
    this.registerParseInfixFn('MODULUS', this.parseInfixExpression.bind(this))

    this.registerParseInfixFn('EXPONENT', this.parseInfixExpression.bind(this))
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
      .with({ type: 'IF' }, () => this.parseIfStatement())
      .with({ type: 'FOR' }, () => this.parseForStatement())
      .with({ type: 'BREAK' }, () => this.parseBreakStatement())
      .otherwise(() => {
        return this.parseExpressionStatement()
      })
  }

  private parseLetStatement(): LetStatement {
    this.nextToken()
    const ident = this.parseIdent()
    this.invariant(
      ident && ident.expressionType === 'ident',
      `expected identifier, got ${this.curToken?.type}`,
    )
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
    this.expectPeek('SEMI')
    return {
      type: 'statement',
      statementType: 'expression',
      expression,
    }
  }

  private parseFunctionStatement(): FunctionStatement {
    this.expectPeek('IDENT')
    this.invariant(this.curToken, 'curToken would be present')
    const name = this.curToken.literal

    this.expectPeek('L_PAREN')
    this.nextToken()

    const parameters: Parameter[] = []
    while (!['R_PAREN', 'EOF'].includes(this.curToken.type)) {
      const identifier = this.parseIdent()
      this.invariant(
        identifier.expressionType === 'ident',
        `expected identifier, got ${formatToken(this.curToken.type, this.curToken.literal)}`,
      )
      this.expectPeek('COLON')
      this.nextToken()
      const typeDef = this.parseTypeDef()
      parameters.push({
        type: 'parameter',
        identifier,
        typeDef,
      })

      if (this.peekToken?.type !== 'R_PAREN') {
        this.expectPeek('COMMA')
      }

      this.nextToken()
    }

    this.expectPeek('COLON')
    this.nextToken()
    const returnType = this.parseTypeDef()

    const body = this.parseBlockStatement()

    return {
      type: 'statement',
      statementType: 'function',
      returnType,
      name,
      parameters,
      body,
    }
  }

  private parseIfStatement(): IfStatement {
    this.invariant(this.curToken?.type === 'IF', 'expected if token')

    this.expectPeek('L_PAREN')
    this.nextToken()

    const test = this.parseExpression()
    this.expectPeek('R_PAREN')

    const consequence = this.parseBlockStatement()
    let alternate: BlockStatement | undefined = undefined
    if (this.peekToken?.type === 'ELSE') {
      this.nextToken()
      alternate = this.parseBlockStatement()
    }

    return {
      type: 'statement',
      statementType: 'if',
      test,
      consequence,
      alternate,
    }
  }

  private parseForStatement(): ForStatement {
    this.invariant(this.curToken?.type === 'FOR', 'expected for token')
    if (this.peekToken?.type === 'L_BRACE') {
      const body = this.parseBlockStatement()
      return {
        type: 'statement',
        statementType: 'for',
        body,
      }
    }

    this.expectPeek('L_PAREN')
    this.nextToken()

    let init: LetStatement | Expression | undefined = undefined
    // @ts-expect-error typescript still considers curToken to be of type 'FOR'
    // but we have called this.nextToken() and the value of the curToken has changed
    if (this.curToken.type === 'LET') {
      const statement = this.parseStatement()
      this.invariant(
        statement && statement.statementType === 'let',
        'expected let initialization',
      )
      init = statement
    } else {
      const expression = this.parseExpression()
      init = expression
      // here we have to expect the SEMI token as the parseExpression method doesn't expect a SEMI
      // unlike the parseStatement
      this.expectPeek('SEMI')
    }
    // consume the semi token
    this.nextToken()

    const test = this.parseExpression()
    this.expectPeek('SEMI')
    // consume the semi token
    this.nextToken()

    const post = this.parseExpression()
    this.expectPeek('R_PAREN')

    const body = this.parseBlockStatement()
    return {
      type: 'statement',
      statementType: 'for',
      init,
      test,
      post,
      body,
    }
  }

  private parseBreakStatement(): BreakStatement {
    this.invariant(this.curToken?.type === 'BREAK', 'expected break token')
    this.expectPeek('SEMI')
    return {
      type: 'statement',
      statementType: 'break',
    }
  }

  private parseBlockStatement(): BlockStatement {
    this.invariant(this.curToken, 'expected token to be present')
    this.expectPeek('L_BRACE')
    this.nextToken()

    const statements: Statement[] = []

    while (true) {
      const shouldExit =
        this.curToken.type === 'EOF' || this.curToken.type === 'R_BRACE'

      if (shouldExit) {
        break
      }

      const statement = this.parseStatement()
      if (statement) {
        statements.push(statement)
      }
      this.nextToken()
    }

    return {
      type: 'statement',
      statementType: 'block',
      statements,
    }
  }

  private parseExpression(
    precedence: Precedence = Precedence.LOWEST,
  ): Expression {
    this.invariant(this.curToken, 'curToken should be present')
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
      this.invariant(this.peekToken, 'peek token is present')
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

  private parseIdent(): Expression {
    this.invariant(this.curToken, 'expected token to be present')

    // TODO: handle call expression where the callee is an call expression itself
    if (this.peekToken?.type === 'L_PAREN') {
      const functionName = this.curToken.literal
      const args: Expression[] = []

      // consume the ident token
      this.nextToken()
      // consume the L_PAREN token
      this.nextToken()

      while (!['EOF', 'R_PAREN'].includes(this.curToken.type)) {
        const arg = this.parseExpression()
        args.push(arg)
        // @ts-expect-error typescript thinks that there would be no overlap, but we call nextToken
        // method, which would change the value of peekToken
        if (this.peekToken.type !== 'R_PAREN') {
          this.expectPeek('COMMA')
        }

        this.nextToken()
      }

      return {
        type: 'expression',
        expressionType: 'call',
        callee: {
          type: 'expression',
          expressionType: 'ident',
          identifier: functionName,
        },
        args,
      }
    }

    return {
      type: 'expression',
      expressionType: 'ident',
      identifier: this.curToken.literal,
    }
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
    this.invariant(this.curToken, 'expected token to be present')
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
    this.invariant(this.curToken, 'expected token to be present')
    return OPERATOR_PREDENCE[this.curToken.type] ?? Precedence.LOWEST
  }

  private peekPrecedence() {
    this.invariant(this.peekToken, 'expected next token to be present')
    return OPERATOR_PREDENCE[this.peekToken?.type] ?? Precedence.LOWEST
  }

  private expectPeek(tokenType: TokenType) {
    if (this.peekToken?.type !== tokenType) {
      this.invariant(this.peekToken, 'expected next token to be present')
      throw createLangError({
        col: this.peekToken?.col,
        line: this.peekToken?.line,
        message: `expected ${chalk.green(formatToken(tokenType))} got ${chalk.yellow(formatToken(this.peekToken?.type, this.peekToken.literal))}`,
        errorType: 'SyntaxError',
        src: this.source,
      })
    }
    this.nextToken()
  }

  private invariant(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    condition: any,
    message: string,
    errorType?: ErrorType,
  ): asserts condition {
    if (!condition) {
      this.throwError(message, errorType)
    }
  }

  private throwError(
    message: string,
    errorType: ErrorType = 'SyntaxError',
  ): never {
    throw createLangError({
      // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
      col: this.curToken?.col!,
      // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
      line: this.curToken?.line!,
      message,
      errorType,
      src: this.source,
    })
  }
}
