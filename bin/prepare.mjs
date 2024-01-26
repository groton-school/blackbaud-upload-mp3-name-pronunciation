import fs from 'fs';
import archiver from 'archiver';
import cli from '@battis/qui-cli';
import path from 'path';

const args = cli.init({
  args: {
    options: {
      target: {
        short: 't',
        description: 'Target name for archive file',
        default: 'store/extension.zip'
      }
    }
  }
});

const zip = fs.createWriteStream(path.resolve(args.values.target));
const archive = archiver('zip');
zip.on('close', () => {
  cli.log.info(`${args.values.target} ${archive.pointer()} total bytes`);
});
archive.on('warning', (err) => {
  if (err.code === 'ENOENT') {
    cli.log.warning(JSON.stringify(err));
  } else {
    throw err;
  }
});
archive.on('error', (err) => {
  throw err;
});
archive.pipe(zip);

args.positionals.forEach((fileName) => {
  if (fs.lstatSync(path.resolve(fileName)).isDirectory()) {
    archive.directory(path.resolve(fileName), path.basename(fileName));
  } else {
    archive.file(path.resolve(fileName), { name: path.basename(fileName) });
  }
});

archive.finalize();
