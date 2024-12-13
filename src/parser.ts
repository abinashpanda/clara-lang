import type { Program } from './ast'
import type { Lexer } from './lexer'

export class Parser {
  constructor(private readonly lexer: Lexer) {}

  parse(): Program {
    const program: Program = { type: 'program', statements: [] }
    return program
  }
}
