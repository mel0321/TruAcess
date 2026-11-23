import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectDirectory = resolve(fileURLToPath(new URL('..', import.meta.url)));
const sourceFile = join(projectDirectory, 'src', 'main.tsx');
const viteCli = join(projectDirectory, 'node_modules', 'vite', 'bin', 'vite.js');
const port = process.env.PORT || '5173';
const url = `http://localhost:${port}`;

if (!existsSync(sourceFile)) {
  console.error('Os arquivos do frontend não foram encontrados em website/web/src.');
  console.error('Recupere o código-fonte do frontend antes de iniciar o site.');
  process.exit(1);
}

const chromePath = [
  process.env.CHROME_PATH,
  join(process.env.ProgramFiles || 'C:\\Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe'),
  join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Google', 'Chrome', 'Application', 'chrome.exe'),
  join(process.env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local'), 'Google', 'Chrome', 'Application', 'chrome.exe'),
].find(path => path && existsSync(path));

if (!chromePath) {
  console.error('Não encontrei o Google Chrome. Defina CHROME_PATH com o caminho de chrome.exe.');
  process.exit(1);
}

function openChrome() {
  const chrome = spawn(chromePath, ['--new-window', url], {
    detached: true,
    stdio: 'ignore',
  });
  chrome.on('error', error => {
    console.error(`Não foi possível abrir o Chrome: ${error.message}`);
  });
  chrome.unref();
}

async function openWhenReady(server) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(`O servidor terminou com código ${server.exitCode}.`);
    }

    try {
      const response = await fetch(url);
      if (response.ok) {
        openChrome();
        console.log(`Site aberto no Chrome: ${url}`);
        return;
      }
    } catch {
      await new Promise(resolveDelay => setTimeout(resolveDelay, 500));
    }
  }

  throw new Error(`O site não respondeu em ${url} após 30 segundos.`);
}

async function start() {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(1000) });
    if (response.ok) {
      openChrome();
      console.log(`O site já estava rodando. Aberto no Chrome: ${url}`);
      return;
    }
  } catch {
    // Nenhum servidor está ouvindo nessa porta; inicie o preview abaixo.
  }

  const server = spawn(process.execPath, [
    viteCli,
    '--host',
    '127.0.0.1',
    '--port',
    port,
    '--strictPort',
  ], {
    cwd: projectDirectory,
    stdio: 'inherit',
  });

  server.on('error', error => {
    console.error(`Não foi possível iniciar o servidor: ${error.message}`);
    process.exitCode = 1;
  });

  server.on('exit', code => {
    if (code && code !== 0) process.exitCode = code;
  });

  await openWhenReady(server);
}

start().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
