import path from 'node:path'
import { program } from 'commander'
import { Runner } from '../src/runner'
import chalk from 'chalk'

program.name('clara').description('runner for clara lang').version('0.1')

program
  .command('run')
  .argument('<string>', 'path of the file')
  .action(async (fileName) => {
    const absPath = path.resolve(fileName)
    const file = Bun.file(absPath)
    if (!(await file.exists())) {
      // eslint-disable-next-line no-console
      console.log(
        `${chalk.red('NotFoundError')}: no file found at path ${chalk.yellow(absPath)}`,
      )
      process.exit(1)
    }
    const content = await file.text()
    const runner = new Runner(content, absPath)
    runner.run()
  })

program
  .command('fmt')
  .argument('<string>', 'path of the file/folder to format')
  .option('--write', 'write the formatted content')
  .action(() => {
    throw new Error('not implemented')
  })

program
  .command('lint')
  .argument('<string>', 'path of the file/folder to lint')
  .option('--fix', 'whether to fix the linter error or not')
  .action(() => {
    throw new Error('not implemented')
  })

program.parse()
