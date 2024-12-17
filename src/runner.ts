import { LangError } from './error'
import { Lexer } from './lexer'
import { Parser } from './parser'

export class Runner {
  constructor(
    private readonly src: string,
    private readonly lexer = new Lexer(src),
    private readonly parser = new Parser(lexer, src),
  ) {}

  run() {
    try {
      this.parser.parse()
    } catch (error) {
      if (error instanceof LangError) {
        // eslint-disable-next-line no-console
        console.log(error.message)
      } else {
        throw error
      }
    }
  }
}
