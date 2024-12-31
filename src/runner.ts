import chalk from 'chalk'
import { LangError } from './error'
import { Lexer } from './lexer'
import { Parser } from './parser'
import { box } from './utils'

export class Runner {
  constructor(
    private readonly src: string,
    private readonly path: string,
    private readonly lexer = new Lexer(src),
    private readonly parser = new Parser(lexer, src),
  ) {}

  run() {
    try {
      const program = this.parser.parse()
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(program, null, 2))
    } catch (error) {
      if (error instanceof LangError) {
        // eslint-disable-next-line no-console
        console.log(
          [
            `${chalk.red('error')} at ${chalk.green(this.path)}:${chalk.yellow(error.line)}:${chalk.yellow(error.col)}`,
            box(error.message.trim()),
          ].join('\n'),
        )
      } else {
        throw error
      }
      process.exit(1)
    }
  }
}
