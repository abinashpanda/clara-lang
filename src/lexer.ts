import { match } from 'ts-pattern'
import { LITERAL_TO_KEYWORD_MAP, type Token, type TokenType } from './token'
import { createLangError, type ErrorType } from './error'

export class Lexer {
  constructor(
    private src: string,
    private readonly rawInput: string = src,
    private line: number = 1,
    private col: number = 1,
  ) {}

  next(): Token {
    this.skipWhitespace()

    if (this.src.length === 0) {
      return { type: 'EOF', literal: '', line: this.line, col: this.col }
    }

    return match(this.src[0])
      .returnType<Token>()
      .with('#', () => {
        this.skipComment()
        return this.next()
      })
      .with(';', () => {
        return this.token('SEMI', 1)
      })
      .with(':', () => {
        return this.token('COLON', 1)
      })
      .with(',', () => {
        return this.token('COMMA', 1)
      })
      .with('.', () => {
        return this.token('DOT', 1)
      })
      .with('+', () => {
        if (this.src[1] === '=') {
          return this.token('PLUS_EQ', 2)
        }
        return this.token('PLUS', 1)
      })
      .with('-', () => {
        if (this.src[1] === '=') {
          return this.token('MINUS_EQ', 2)
        }
        return this.token('MINUS', 1)
      })
      .with('*', () => {
        if (this.src[1] === '=') {
          return this.token('ASTERISK_EQ', 2)
        }
        if (this.src[1] === '*') {
          return this.token('EXPONENT', 2)
        }
        return this.token('ASTERISK', 1)
      })
      .with('/', () => {
        if (this.src[1] === '=') {
          return this.token('SLASH_EQ', 2)
        }
        return this.token('SLASH', 1)
      })
      .with('%', () => {
        if (this.src[1] === '=') {
          return this.token('MODULUS_EQ', 2)
        }
        return this.token('MODULUS', 1)
      })
      .with('=', () => {
        if (this.src[1] === '=') {
          return this.token('EQ_EQ', 2)
        }
        return this.token('EQ', 1)
      })
      .with('>', () => {
        if (this.src[1] === '=') {
          return this.token('GTE', 2)
        }
        if (this.src[1] === '>') {
          return this.token('RIGHT_SHIFT', 2)
        }
        return this.token('GT', 1)
      })
      .with('<', () => {
        if (this.src[1] === '=') {
          return this.token('LTE', 2)
        }
        if (this.src[1] === '<') {
          return this.token('LEFT_SHIFT', 2)
        }
        return this.token('LT', 1)
      })
      .with('!', () => {
        if (this.src[1] === '=') {
          return this.token('NOT_EQ', 2)
        }
        return this.token('BANG', 1)
      })
      .with('&', () => {
        return this.token('BITWISE_AND', 1)
      })
      .with('|', () => {
        return this.token('BITWISE_OR', 1)
      })
      .with('^', () => {
        return this.token('BITWISE_XOR', 1)
      })
      .with('(', () => {
        return this.token('L_PAREN', 1)
      })
      .with(')', () => {
        return this.token('R_PAREN', 1)
      })
      .with('{', () => {
        return this.token('L_BRACE', 1)
      })
      .with('}', () => {
        return this.token('R_BRACE', 1)
      })
      .with('[', () => {
        return this.token('L_SQUARE', 1)
      })
      .with(']', () => {
        return this.token('R_SQUARE', 1)
      })
      .with('"', () => {
        return this.parseSingleLineString()
      })
      .otherwise((val) => {
        if (/[0-9]/.test(val)) {
          return this.parseNumber()
        }
        if (/[a-zA-z_]/.test(val)) {
          return this.parseIdentifier()
        }
        this.throwError(`invalid token ${val}`, 'SyntaxError')
      })
  }

  private token(tokenType: TokenType, len: number): Token {
    const col = this.col
    return {
      type: tokenType,
      literal: this.slice(len),
      line: this.line,
      col,
    }
  }

  private parseSingleLineString(): Token {
    const col = this.col
    this.slice(1)
    let i = 1
    while (this.src[i] !== '"' && i <= this.src.length) {
      i += 1
      // TODO: Handle the case where the lexer encounters a new line
    }
    const literal = this.slice(i)
    this.slice(1)
    return {
      type: 'STRING',
      literal,
      col,
      line: this.line,
    }
  }

  private parseNumber(): Token {
    const col = this.col
    const NUMBER_REGEX = /^[0-9]+[.]?[0-9]*$/
    let i = 1
    while (NUMBER_REGEX.test(this.src.slice(0, i)) && i <= this.src.length) {
      i += 1
    }
    const literal = this.slice(i - 1)
    return {
      type: 'NUMBER',
      literal,
      line: this.line,
      col,
    }
  }

  private parseIdentifier(): Token {
    const col = this.col
    const IDENTIFIER_REGEX = /^[a-zA-z_][a-zA-Z0-9_]*$/
    let i = 1
    while (
      IDENTIFIER_REGEX.test(this.src.slice(0, i)) &&
      i <= this.src.length
    ) {
      i += 1
    }
    const literal = this.slice(i - 1)
    const keyword = LITERAL_TO_KEYWORD_MAP[literal]
    if (keyword) {
      return {
        type: keyword,
        literal,
        line: this.line,
        col,
      }
    }
    return {
      type: 'IDENT',
      literal,
      line: this.line,
      col,
    }
  }

  private skipWhitespace() {
    while (
      this.src[0] === ' ' ||
      this.src[0] === '\t' ||
      this.src[0] === '\n' ||
      this.src[0] === '\r'
    ) {
      const isNewLine = this.src[0] === '\n' || this.src[0] === '\r'
      this.slice(1)
      if (isNewLine) {
        this.line += 1
        this.col = 1
      }
    }
  }

  private skipComment() {
    let i = 0
    while (this.src[i] !== '\n' && i <= this.src.length) {
      i += 1
    }
    this.slice(i + 1)
    this.line += 1
    this.col = 1
  }

  private slice(len: number) {
    const token = this.src.slice(0, len)
    this.src = this.src.slice(len)
    this.col += len
    return token
  }

  private throwError(
    message: string,
    errorType: ErrorType = 'SyntaxError',
  ): never {
    throw createLangError({
      col: this.col,
      line: this.line,
      message,
      errorType,
      src: this.rawInput,
    })
  }
}
