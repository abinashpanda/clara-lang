import { program } from 'commander'
import { Runner } from '../src/runner'

program.name('clara').description('runner for clara lang').version('0.1')

program
  .command('run')
  .argument('<string>', 'path of the file')
  .action(async (fileName) => {
    const file = Bun.file(fileName)
    const content = await file.text()
    const runner = new Runner(content)
    runner.run()
  })

program.parse()
