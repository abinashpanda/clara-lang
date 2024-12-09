import { match } from 'ts-pattern'
import type { Token, TokenType } from './token'

export class Lexer {
  constructor(
    private src: string,
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
      .with(';', () => {
        return this.token('SEMI', 1)
      })
      .with('+', () => {
        return this.token('PLUS', 1)
      })
      .with('-', () => {
        return this.token('MINUS', 1)
      })
      .otherwise((val) => {
        if (/[0-9]/i.test(val)) {
          return this.parseNumber()
        }
        throw new Error(`invalid token ${val}`)
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

  private parseNumber(): Token {
    const NUMBER_REGEX = /^[0-9]+[.]?[0-9]*$/
    let i = 1
    while (NUMBER_REGEX.test(this.src.slice(0, i)) && i <= this.src.length) {
      i += 1
    }
    const col = this.col
    const literal = this.slice(i - 1)
    return {
      type: 'NUMBER',
      literal,
      line: this.line,
      col,
    }
  }

  private skipWhitespace() {
    while (this.src[0] === '\n' || this.src[0] === '\r') {
      this.line += 1
      this.col = 1
      this.src = this.src.slice(1)
    }
    while (this.src[0] === ' ' || this.src[0] === '\t') {
      this.slice(1)
    }
  }

  private slice(len: number) {
    const token = this.src.slice(0, len)
    this.src = this.src.slice(len)
    this.col += len
    return token
  }
}
