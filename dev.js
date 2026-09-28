
const { spawn, spawnSync } = require('child_process');
const path = require('path');

const backendDir = path.join(__dirname, 'backend');
const colors = { mailpit: '\x1b[33m', backend: '\x1b[36m', reset: '\x1b[0m' };

function commandExists(cmd) {
  const checker = process.platform === 'win32' ? 'where' : 'which';
  return spawnSync(checker, [cmd], { stdio: 'ignore', shell: true }).status === 0;
}

function runSync(cmd, args, cwd) {
  const result = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: true });
  if (result.status !== 0) {
    console.error(`\n"${cmd} ${args.join(' ')}" failed — is \`npm install\` done in backend/?`);
    process.exit(result.status ?? 1);
  }
}

function prefixLines(label, color, data) {
  const text = data.toString().replace(/\n$/, '');
  if (!text) return;
  text
    .split('\n')
    .forEach((line) => process.stdout.write(`${color}[${label}]${colors.reset} ${line}\n`));
}

const children = [];

function spawnLabeled(label, color, cmd, args, cwd) {
  const child = spawn(cmd, args, { cwd, shell: true, stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.on('data', (d) => prefixLines(label, color, d));
  child.stderr.on('data', (d) => prefixLines(label, color, d));
  children.push(child);
  return child;
}

console.log('Syncing database schema and seeding the task catalogue...');
runSync('npm', ['run', 'db:push'], backendDir);
runSync('npm', ['run', 'prisma:seed'], backendDir);
console.log('');

if (commandExists('mailpit')) {
  console.log('Starting Mailpit — SMTP on :1025, web UI at http://localhost:8025');
  spawnLabeled('mailpit', colors.mailpit, 'mailpit', [], __dirname);
} else {
  console.log('Mailpit not found on PATH — OTP emails will print to the backend console instead.');
  console.log('Install it anytime with `winget install axllent.mailpit` (see README section 2.1).');
}

console.log('Starting backend API — http://localhost:4000');
console.log('');
spawnLabeled('backend', colors.backend, 'npm', ['run', 'dev'], backendDir);

console.log('Everything is starting up. Press Ctrl+C to stop.');
console.log('For the mobile app, run `cd mobile && npx expo start` in another terminal.\n');

function shutdown() {
  console.log('\nStopping...');
  children.forEach((child) => child.kill());
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
