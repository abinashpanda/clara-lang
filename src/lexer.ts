import { match } from 'ts-pattern'
import { LITERAL_TO_KEYWORD_MAP, type Token, type TokenType } from './token'

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
        return this.token('PLUS', 1)
      })
      .with('-', () => {
        return this.token('MINUS', 1)
      })
      .with('*', () => {
        return this.token('ASTERISK', 1)
      })
      .with('/', () => {
        return this.token('SLASH', 1)
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
        return this.token('GT', 1)
      })
      .with('<', () => {
        if (this.src[1] === '=') {
          return this.token('LTE', 2)
        }
        return this.token('LT', 1)
      })
      .with('!', () => {
        if (this.src[1] === '=') {
          return this.token('NOT_EQ', 2)
        }
        return this.token('BANG', 1)
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
      .otherwise((val) => {
        if (/[0-9]/.test(val)) {
          return this.parseNumber()
        }
        if (/[a-zA-z_]/.test(val)) {
          return this.parseIdentifier()
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
    while (this.src[0] === '\n' || this.src[0] === '\r') {
      this.line += 1
      this.col = 1
      this.src = this.src.slice(1)
    }
    while (this.src[0] === ' ' || this.src[0] === '\t') {
      this.slice(1)
    }
  }

  private skipComment() {
    let i = 0
    while (this.src[i] !== '\n' && i <= this.src.length) {
      i += 1
    }
    this.src = this.src.slice(i + 1)
    this.line += 1
    this.col = 1
  }

  private slice(len: number) {
    const token = this.src.slice(0, len)
    this.src = this.src.slice(len)
    this.col += len
    return token
  }
}
