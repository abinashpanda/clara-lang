import path from 'node:path'
import { program } from 'commander'
import { Runner } from '../src/runner'

program.name('clara').description('runner for clara lang').version('0.1')

program
  .command('run')
  .argument('<string>', 'path of the file')
  .action(async (fileName) => {
    const absPath = path.resolve(fileName)
    const file = Bun.file(absPath)
    const content = await file.text()
    const runner = new Runner(content, absPath)
    runner.run()
  })

program.parse()
