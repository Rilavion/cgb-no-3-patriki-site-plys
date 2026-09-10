import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

rmSync(resolve('dist/pages'), { recursive: true, force: true });

let buildCompleted = false;
const child = spawn(
  process.execPath,
  [resolve('node_modules/vinext/dist/cli.js'), 'build'],
  {
    env: process.env,
    stdio: ['inherit', 'pipe', 'pipe'],
  },
);

function forward(stream, target) {
  stream.on('data', (chunk) => {
    const output = chunk.toString();
    if (output.includes('Build complete.')) buildCompleted = true;
    target.write(chunk);
  });
}

forward(child.stdout, process.stdout);
forward(child.stderr, process.stderr);

child.on('error', (error) => {
  console.error(error);
  process.exitCode = 1;
});

child.on('close', (code) => {
  const artifactExists = existsSync(resolve('dist/client/index.html'));
  // vinext 1.0.0-beta.5 sometimes exits after a successful Windows build with a libuv assertion.
  // Treat only an explicitly completed build with a verified static artifact as successful.
  const successful = code === 0 || (buildCompleted && artifactExists);
  if (successful) {
    const clientDirectory = resolve('dist/client');
    const pagesDirectory = resolve('dist/pages');
    const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1];
    rmSync(pagesDirectory, { recursive: true, force: true });
    mkdirSync(pagesDirectory, { recursive: true });

    if (process.env.GITHUB_ACTIONS === 'true' && repositoryName) {
      for (const name of [
        'index.html',
        'index.rsc',
        '404.html',
        'og.png',
        'favicon.svg',
      ]) {
        const source = resolve(clientDirectory, name);
        if (existsSync(source)) cpSync(source, resolve(pagesDirectory, name));
      }
      cpSync(
        resolve(clientDirectory, repositoryName, '_next'),
        resolve(pagesDirectory, '_next'),
        {
          recursive: true,
        },
      );
    } else {
      cpSync(clientDirectory, pagesDirectory, { recursive: true });
    }
    writeFileSync(resolve(pagesDirectory, '.nojekyll'), '');
  }
  process.exitCode = successful ? 0 : (code ?? 1);
});
