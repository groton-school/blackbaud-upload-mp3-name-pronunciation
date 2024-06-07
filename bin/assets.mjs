import cli from '@battis/qui-cli';
import path from 'path';

const args = cli.init({
  args: {
    positionals: true,
    options: {
      target: {
        short: 't',
        description: 'Target directory for asset files',
        default: 'assets'
      }
    }
  }
});

cli.shell.mkdir('-p', path.resolve(args.values.target));
args.positionals.forEach((fileName) => {
  cli.shell.cp('-R', path.resolve(fileName), path.resolve(args.values.target));
});
