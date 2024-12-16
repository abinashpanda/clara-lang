import type { Context } from './context'
import { Lexer } from './lexer'
import { Parser } from './parser'

export class Runner {
  constructor(
    private readonly src: string,
    private readonly context: Context,
    private readonly lexer = new Lexer(src, context),
    private readonly parser = new Parser(lexer, context),
  ) {}

  run() {
    const program = this.parser.parse()
    console.log(program)
  }
}
