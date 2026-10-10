/**
 * ╔══════════════════════════════════════════════╗
 * ║          XMD-TECH WhatsApp Bot               ║
 * ║       Auto-Download & Self-Update Engine     ║
 * ║         Built by ADEZ Tech · Nairobi         ║
 * ╚══════════════════════════════════════════════╝
 */

const { spawn }    = require('child_process');
const path         = require('path');
const fs           = require('fs');
const os           = require('os');
const axios        = require('axios');
const AdmZip       = require('adm-zip');
require('dotenv').config();

// ─── CONFIG ─────────────────────────────────────────────────────────────────

const BOT_FILE      = 'xmd.js';
const ZIP_PATH      = 'xmd-bot.zip';
const EXTRACT_PATH  = './';
const RESTART_DELAY = 4000;
const MAX_RETRIES   = 3;
const AXIOS_TIMEOUT = 12000;
const TIMEZONE      = 'Africa/Nairobi';
const VERSION       = '2.0.0';

// Update servers — add your own hosting URLs here
const UPDATE_SERVERS = [
  { name: 'Primary',   url: process.env.UPDATE_SERVER_1 || 'https://updates.adeztech.co.ke' },
  { name: 'Secondary', url: process.env.UPDATE_SERVER_2 || 'https://backup.adeztech.co.ke' },
  { name: 'Fallback',  url: process.env.UPDATE_SERVER_3 || '' },
];

// Direct fallback ZIP (host your own bot.zip here)
const FALLBACK_ZIP_URL = process.env.FALLBACK_ZIP_URL || '';

let retryCount  = 0;
let coreProcess = null;

// ─── LOGGING ─────────────────────────────────────────────────────────────────

const COLORS = {
  reset:  '\x1b[0m',
  cyan:   '\x1b[96m',
  green:  '\x1b[92m',
  yellow: '\x1b[93m',
  red:    '\x1b[91m',
  blue:   '\x1b[94m',
  dim:    '\x1b[2m',
  bold:   '\x1b[1m',
};

function timestamp() {
  return new Date().toLocaleTimeString('en-KE', {
    timeZone: TIMEZONE,
    hour12: false,
  });
}

function log(msg, level = 'info') {
  const colors = {
    info:    COLORS.cyan,
    success: COLORS.green,
    warn:    COLORS.yellow,
    error:   COLORS.red,
  };
  const icons = {
    info:    '◈',
    success: '✓',
    warn:    '⚠',
    error:   '✗',
  };
  const color = colors[level] || COLORS.cyan;
  const icon  = icons[level]  || '◈';
  console.log(
    `${COLORS.dim}[${timestamp()}]${COLORS.reset} ${color}${COLORS.bold}${icon}${COLORS.reset} ${color}[XMD-TECH]${COLORS.reset} ${msg}`
  );

  // Also write to log file
  const logDir  = path.join(__dirname, 'tmp');
  const logFile = path.join(logDir, `${new Date().toISOString().slice(0, 10)}.log`);
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  fs.appendFileSync(logFile, `[${timestamp()}] [${level.toUpperCase()}] ${msg}\n`);
}

function printBanner() {
  const b = COLORS.cyan + COLORS.bold;
  const r = COLORS.reset;
  const d = COLORS.dim;
  console.log(`
${b}╔══════════════════════════════════════════════╗${r}
${b}║                                              ║${r}
${b}║   ██╗  ██╗███╗   ███╗██████╗                ║${r}
${b}║   ╚██╗██╔╝████╗ ████║██╔══██╗               ║${r}
${b}║    ╚███╔╝ ██╔████╔██║██║  ██║               ║${r}
${b}║    ██╔██╗ ██║╚██╔╝██║██║  ██║               ║${r}
${b}║   ██╔╝ ██╗██║ ╚═╝ ██║██████╔╝               ║${r}
${b}║   ╚═╝  ╚═╝╚═╝     ╚═╝╚═════╝  TECH          ║${r}
${b}║                                              ║${r}
${b}║   ${d}WhatsApp Bot · Auto-Update Engine v${VERSION}${b}   ║${r}
${b}║   ${d}Built by ADEZ Tech · Nairobi, Kenya${b}      ║${r}
${b}║                                              ║${r}
${b}╚══════════════════════════════════════════════╝${r}
`);
}

// ─── PLATFORM DETECTION ──────────────────────────────────────────────────────

function detectPlatform() {
  if (process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_SERVICE_NAME) return 'Railway';
  if (process.env.DYNO)                         return 'Heroku';
  if (process.env.RENDER)                       return 'Render';
  if (process.env.PREFIX?.includes('termux'))   return 'Termux';
  if (process.env.P_SERVER_UUID)                return 'Panel';
  if (process.env.LXC)                          return 'Linux Container';
  switch (os.platform()) {
    case 'win32':  return 'Windows';
    case 'darwin': return 'macOS';
    case 'linux':  return 'Linux';
    default:       return 'Unknown';
  }
}

// ─── PATHS TO PRESERVE ON UPDATE ─────────────────────────────────────────────

const PRESERVE_PATHS = [
  './src/Database',
  './node_modules',
  './src/Session',
  './src/Session/creds.json.bak',
  './index.js',
  './tmp',
  './.env',
  './app.json',
  './package-lock.json',
  './yarn.lock',
  './pnpm-lock.yaml',
];

const RESOLVED_PRESERVE = PRESERVE_PATHS
  .filter(p => fs.existsSync(p))
  .map(p  => path.resolve(p));

function shouldPreserve(filePath) {
  const resolved = path.resolve(filePath);
  return RESOLVED_PRESERVE.some(p => resolved.startsWith(p));
}

// ─── DOWNLOAD ────────────────────────────────────────────────────────────────

async function downloadFile(url, dest) {
  const response = await axios({
    url,
    method:       'GET',
    responseType: 'stream',
    timeout:      AXIOS_TIMEOUT,
  });
  const writer = fs.createWriteStream(dest);
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error',  reject);
  });
}

async function tryServer(server) {
  if (!server.url) return false;
  try {
    log(`Checking ${server.name} server...`);
    // First fetch the latest release manifest
    const manifest = await axios.get(`${server.url}/manifest.json`, {
      timeout: AXIOS_TIMEOUT,
    });
    if (manifest.data?.status !== 'ok') return false;

    const zipUrl = manifest.data.download;
    log(`Downloading update from ${server.name}...`);
    await downloadFile(zipUrl, ZIP_PATH);
    log(`Download complete via ${server.name}`, 'success');
    return true;
  } catch (err) {
    log(`${server.name} server failed: ${err.message}`, 'warn');
    return false;
  }
}

async function downloadWithFallback() {
  log('Checking for updates...');

  // Try each update server in order
  for (const server of UPDATE_SERVERS) {
    if (await tryServer(server)) return;
  }

  // Direct ZIP fallback
  if (FALLBACK_ZIP_URL) {
    try {
      log('Trying direct fallback ZIP...', 'warn');
      await downloadFile(FALLBACK_ZIP_URL, ZIP_PATH);
      log('Fallback ZIP downloaded.', 'success');
      return;
    } catch (err) {
      log(`Fallback ZIP failed: ${err.message}`, 'error');
    }
  }

  // No update available — check if we already have the bot
  if (fs.existsSync(BOT_FILE)) {
    log('No update servers reachable. Running existing bot file.', 'warn');
    return;
  }

  throw new Error(
    'No update servers reachable and no existing bot file found.\n' +
    'Set UPDATE_SERVER_1 or FALLBACK_ZIP_URL in your .env'
  );
}

// ─── EXTRACT ─────────────────────────────────────────────────────────────────

async function extractZip(zipFile, outputPath) {
  if (!fs.existsSync(zipFile)) {
    log('No ZIP to extract — skipping.', 'warn');
    return;
  }

  log('Extracting update...');
  const zip     = new AdmZip(zipFile);
  const entries = zip.getEntries();

  // Remove old non-preserved files
  const walk = (dir, list = []) => {
    fs.readdirSync(dir).forEach(f => {
      const full = path.join(dir, f);
      if (shouldPreserve(full)) return;
      fs.statSync(full).isDirectory() ? walk(full, list) : list.push(full);
    });
    return list;
  };

  walk(outputPath).forEach(f => {
    try { if (!shouldPreserve(f)) fs.unlinkSync(f); } catch (_) {}
  });

  // Write new files
  entries.forEach(entry => {
    const dest = path.join(outputPath, entry.entryName);
    if (shouldPreserve(dest)) return;
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!entry.isDirectory) fs.writeFileSync(dest, zip.readFile(entry));
  });

  // Clean up ZIP
  try { fs.unlinkSync(zipFile); } catch (_) {}
  log('Extraction complete.', 'success');
}

// ─── DEPENDENCIES ────────────────────────────────────────────────────────────

async function installDependencies() {
  return new Promise((resolve, reject) => {
    log('Installing/verifying dependencies...');

    const proc = spawn('npm', [
      'install',
      '--no-audit',
      '--no-fund',
      '--no-progress',
      '--omit=dev',
      '--prefer-offline',
      '--foreground-scripts=false',
    ], {
      stdio: 'pipe',
      shell: false,
      env: {
        ...process.env,
        npm_config_loglevel:          'error',
        npm_config_audit:             'false',
        npm_config_fund:              'false',
        npm_config_update_notifier:   'false',
        CI:                           'true',
      },
    });

    proc.stderr.on('data', data => {
      const text = data.toString();
      if (!text.includes('deprecated') && !text.includes('funding')) {
        process.stderr.write(text);
      }
    });

    proc.on('close', code => {
      if (code !== 0) return reject(new Error(`npm install failed (code ${code})`));
      log('Dependencies ready.', 'success');
      resolve();
    });

    proc.on('error', err => reject(new Error(`npm error: ${err.message}`)));
  });
}

// ─── SESSION RESTORE ─────────────────────────────────────────────────────────

function restoreSessionBackup() {
  const sessionDir = path.join(__dirname, 'src', 'Session');
  const bakFile    = path.join(sessionDir, 'creds.json.bak');
  const credsFile  = path.join(sessionDir, 'creds.json');

  if (fs.existsSync(bakFile) && !fs.existsSync(credsFile)) {
    log('Restoring session from backup...');
    fs.copyFileSync(bakFile, credsFile);
    log('Session restored.', 'success');
  }
}

// ─── START BOT ───────────────────────────────────────────────────────────────

async function startBot() {
  if (!fs.existsSync(BOT_FILE)) {
    throw new Error(`Bot file "${BOT_FILE}" not found after extraction.`);
  }

  restoreSessionBackup();

  const platform = detectPlatform();
  log(`Starting XMD-TECH on ${platform} (attempt ${retryCount + 1}/${MAX_RETRIES})...`);

  const logDir  = path.join(__dirname, 'tmp');
  const logFile = path.join(logDir, `${new Date().toISOString().slice(0, 10)}.log`);
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
  const errorStream = fs.createWriteStream(logFile, { flags: 'a' });

  coreProcess = spawn('node', [BOT_FILE], {
    stdio: ['inherit', 'inherit', 'pipe'],
    shell: true,
    windowsHide: true,
    env: {
      ...process.env,
      FORCE_COLOR:  '3',
      TERM:         'xterm-256color',
      COLORTERM:    'truecolor',
    },
  });

  coreProcess.stderr.on('data', data => {
    process.stderr.write(data);
    errorStream.write(`[${timestamp()}] ${data.toString().replace(/\x1B\[[0-9;]*[mGK]/g, '')}`);
  });

  coreProcess.on('close', code => {
    errorStream.end();
    log(`Bot process exited with code ${code}.`, code === 0 ? 'info' : 'warn');

    // Invalid session — clear and restart fresh
    if (code === 10) {
      log('Invalid session detected. Clearing session data...', 'warn');
      const sessionDir = path.join(__dirname, 'src', 'Session');
      try {
        if (fs.existsSync(sessionDir)) {
          fs.rmSync(sessionDir, { recursive: true, force: true });
        }
      } catch (e) {
        log(`Session clear error: ${e.message}`, 'error');
      }
      retryCount = 0;
      return setTimeout(main, RESTART_DELAY);
    }

    // Normal restart
    handleRetry(code !== 0 ? new Error(`Exited with code ${code}`) : null);
  });

  coreProcess.on('error', err => {
    errorStream.end();
    log(`Bot process error: ${err.message}`, 'error');
    handleRetry(err);
  });

  // Graceful shutdown handlers
  const shutdown = signal => {
    log(`Shutting down (${signal})...`, 'warn');
    if (coreProcess) coreProcess.kill();
    errorStream.end();
    process.exit(0);
  };
  process.on('SIGINT',  () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

// ─── RETRY / MAIN ─────────────────────────────────────────────────────────────

function handleRetry(error) {
  if (error && retryCount < MAX_RETRIES - 1) {
    retryCount++;
    log(`Retrying in ${RESTART_DELAY / 1000}s (${retryCount}/${MAX_RETRIES})...`, 'warn');
    setTimeout(main, RESTART_DELAY);
  } else {
    if (error) {
      log(`Max retries reached. Final error: ${error.message}`, 'error');
    }
    process.exit(1);
  }
}

async function main() {
  try {
    printBanner();
    log(`XMD-TECH v${VERSION} starting...`);
    log(`Platform: ${detectPlatform()}`);
    log(`Node: ${process.version}`);

    await downloadWithFallback();
    await extractZip(ZIP_PATH, EXTRACT_PATH);
    await installDependencies();
    await startBot();

    retryCount = 0;
  } catch (err) {
    log(`Startup error: ${err.message}`, 'error');
    handleRetry(err);
  }
}

main();
