#!/usr/bin/env node
/**
 * Kuber — Automated Setup Script
 * Works on Windows, macOS, and Linux.
 * Usage: node setup.js
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, copyFileSync } from 'fs';
import { randomBytes } from 'crypto';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const log = (msg) => console.log(`  ${msg}`);
const ok = (msg) => console.log(`  ✅ ${msg}`);
const warn = (msg) => console.log(`  ⚠️  ${msg}`);
const err = (msg) => { console.error(`  ❌ ${msg}`); process.exit(1); };

console.log('\n╔══════════════════════════════════════╗');
console.log('║      🏦  Kuber — Setup Wizard        ║');
console.log('╚══════════════════════════════════════╝\n');

// ── Node version check ─────────────────────────────────────────────────────────
const [major] = process.versions.node.split('.').map(Number);
if (major < 18) err(`Node.js 18+ required. You have v${process.versions.node}`);
ok(`Node.js v${process.versions.node}`);

// ── Backend .env ───────────────────────────────────────────────────────────────
log('Setting up backend environment…');
const backendEnv = join(__dirname, 'Backend', '.env');
const backendEnvEx = join(__dirname, 'Backend', '.env.example');

if (!existsSync(backendEnv)) {
  let content = readFileSync(backendEnvEx, 'utf8');
  const secret = randomBytes(64).toString('hex');
  content = content.replace('your_super_secret_jwt_key_change_this_in_production', secret);
  writeFileSync(backendEnv, content, 'utf8');
  ok('backend/.env created with a random JWT secret');
} else {
  warn('backend/.env already exists — skipped');
}

// ── Frontend .env ──────────────────────────────────────────────────────────────
log('Setting up frontend environment…');
const frontendEnv = join(__dirname, 'Frontend', '.env');
const frontendEnvEx = join(__dirname, 'Frontend', '.env.example');

if (!existsSync(frontendEnv)) {
  copyFileSync(frontendEnvEx, frontendEnv);
  ok('frontend/.env created');
} else {
  warn('frontend/.env already exists — skipped');
}

// ── Install dependencies ───────────────────────────────────────────────────────
console.log('\n📦 Installing backend dependencies…');
try {
  execSync('npm install', { cwd: join(__dirname, 'Backend'), stdio: 'inherit' });
  ok('Backend packages installed');
} catch {
  err('Failed to install backend dependencies. Is npm available?');
}

console.log('\n📦 Installing frontend dependencies…');
try {
  execSync('npm install', { cwd: join(__dirname, 'Frontend'), stdio: 'inherit' });
  ok('Frontend packages installed');
} catch {
  err('Failed to install frontend dependencies.');
}

// ── Done ───────────────────────────────────────────────────────────────────────
console.log(`
╔══════════════════════════════════════════════════════╗
║              ✅  Setup Complete!                     ║
╚══════════════════════════════════════════════════════╝

Next steps:

  1. Make sure MongoDB is running:
       mongod
     Or use MongoDB Atlas — update MONGODB_URI in Backend/.env

  2. (Optional) Configure email in Backend/.env
       Add SMTP_HOST / SMTP_USER / SMTP_PASS  or  SENDGRID_API_KEY
       In dev mode emails are only logged to the console — no config needed.

  3. Start the backend (Terminal 1):
       cd Backend && npm run dev

  4. Start the frontend (Terminal 2):
       cd Frontend && npm run dev

  5. Open your browser:
       http://localhost:5173

  New accounts start with $1,000 CAD for testing.
`);
