/**
 * XMD-TECH WhatsApp Bot — Menu System
 * Drop this into your xmd.js and call: sendMenu(sock, jid)
 */

const os   = require('os');
const { performance } = require('perf_hooks');

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function getUptime() {
  const s = Math.floor(process.uptime());
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

function getRamUsage() {
  const used  = process.memoryUsage().heapUsed / 1024 / 1024;
  const total = os.totalmem() / 1024 / 1024;
  return `${used.toFixed(0)}MB / ${total.toFixed(0)}MB`;
}

function getPing(start) {
  return `${Math.floor(performance.now() - start)}ms`;
}

function getNairobiTime() {
  return new Date().toLocaleTimeString('en-KE', {
    timeZone: 'Africa/Nairobi',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function getNairobiDate() {
  return new Date().toLocaleDateString('en-KE', {
    timeZone: 'Africa/Nairobi',
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

// ─── MENU BUILDER ─────────────────────────────────────────────────────────────

function buildMenu(ownerName = 'Arnold', prefix = '.') {
  const p = prefix;
  const start = performance.now();

  const header = `
╔══════════════════════════════╗
║  ⚡  *X M D - T E C H*  ⚡  ║
║   WhatsApp Automation Bot    ║
╚══════════════════════════════╝

👤 *Owner:* ${ownerName}
🕐 *Time:*  ${getNairobiTime()} EAT
📅 *Date:*  ${getNairobiDate()}
⚡ *Ping:*  ${getPing(start)}
🔋 *RAM:*   ${getRamUsage()}
⏱ *Uptime:* ${getUptime()}
🌐 *Platform:* ${detectPlatform()}

> Type *${p}help <command>* for details
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  const sections = [

    {
      title: '🤖  A I  &  I N T E L L I G E N C E',
      cmds: [
        [`${p}ai`, 'Chat with Claude AI'],
        [`${p}gpt`, 'GPT-4 powered answers'],
        [`${p}imagine`, 'Generate AI images'],
        [`${p}translate`, 'Translate any text'],
        [`${p}summarize`, 'Summarize text/URLs'],
        [`${p}analyze`, 'AI image analysis'],
        [`${p}search`, 'Web search + AI summary'],
        [`${p}ideas`, 'Generate creative ideas'],
        [`${p}jarvis`, 'Full AI assistant'],
      ],
    },

    {
      title: '📥  M E D I A  D O W N L O A D E R',
      cmds: [
        [`${p}ytmp4`, 'YouTube video (MP4)'],
        [`${p}ytmp3`, 'YouTube audio (MP3)'],
        [`${p}ig`, 'Instagram photos/reels'],
        [`${p}tiktok`, 'TikTok no-watermark'],
        [`${p}twitter`, 'Twitter/X videos'],
        [`${p}spotify`, 'Spotify tracks'],
        [`${p}fb`, 'Facebook videos'],
        [`${p}pin`, 'Pinterest media'],
        [`${p}song`, 'Search & download songs'],
        [`${p}sticker`, 'Image/video → sticker'],
      ],
    },

    {
      title: '👑  G R O U P  M A N A G E M E N T',
      cmds: [
        [`${p}kick`, 'Remove member'],
        [`${p}promote`, 'Make member admin'],
        [`${p}demote`, 'Remove admin rights'],
        [`${p}mute`, 'Mute group'],
        [`${p}unmute`, 'Unmute group'],
        [`${p}antilink`, 'Block links on/off'],
        [`${p}antispam`, 'Auto kick spammers'],
        [`${p}welcome`, 'Welcome message on/off'],
        [`${p}goodbye`, 'Goodbye message on/off'],
        [`${p}tagall`, 'Tag all members'],
        [`${p}groupinfo`, 'Group details'],
        [`${p}revoke`, 'Reset invite link'],
        [`${p}setname`, 'Change group name'],
        [`${p}setdp`, 'Set group picture'],
        [`${p}warn`, 'Warn member (3=kick)'],
      ],
    },

    {
      title: '🛠️  U T I L I T Y  T O O L S',
      cmds: [
        [`${p}forex`, 'Currency exchange rates'],
        [`${p}weather`, 'Weather forecast'],
        [`${p}mpesa`, 'M-Pesa tariff checker'],
        [`${p}kplc`, 'KPLC token status'],
        [`${p}calc`, 'Calculator'],
        [`${p}remind`, 'Set reminder'],
        [`${p}news`, 'Latest Kenya news'],
        [`${p}track`, 'Track parcels'],
        [`${p}password`, 'Generate password'],
        [`${p}qr`, 'Generate QR code'],
        [`${p}shorturl`, 'Shorten long URLs'],
        [`${p}ip`, 'IP address lookup'],
      ],
    },

    {
      title: '🎨  M E D I A  &  C O N V E R S I O N',
      cmds: [
        [`${p}toimg`, 'Sticker → image'],
        [`${p}togif`, 'Video → GIF'],
        [`${p}tts`, 'Text → voice note'],
        [`${p}transcribe`, 'Voice note → text'],
        [`${p}rotate`, 'Rotate image'],
        [`${p}caption`, 'Add text to image'],
        [`${p}emojimix`, 'Combine two emojis'],
        [`${p}resize`, 'Resize image'],
      ],
    },

    {
      title: '🎮  F U N  &  G A M E S',
      cmds: [
        [`${p}joke`, 'Random joke'],
        [`${p}quote`, 'Motivational quote'],
        [`${p}trivia`, 'Quick trivia game'],
        [`${p}riddle`, 'Brain teaser'],
        [`${p}hangman`, 'Hangman game'],
        [`${p}8ball`, 'Magic 8-ball'],
        [`${p}dice`, 'Roll dice'],
        [`${p}flip`, 'Flip a coin'],
        [`${p}lyrics`, 'Get song lyrics'],
        [`${p}horoscope`, 'Daily horoscope'],
      ],
    },

    {
      title: '⚙️  B O T  S E T T I N G S',
      cmds: [
        [`${p}menu`, 'Show this menu'],
        [`${p}ping`, 'Check bot speed'],
        [`${p}botinfo`, 'Bot version & stats'],
        [`${p}profile`, 'Your usage stats'],
        [`${p}lang`, 'Change language'],
        [`${p}notify`, 'Toggle notifications'],
        [`${p}stats`, 'Global bot stats'],
        [`${p}update`, 'Check for bot update'],
        [`${p}restart`, 'Restart bot (owner)'],
        [`${p}help`, 'Help for any command'],
      ],
    },

  ];

  // Build the body
  const body = sections.map(({ title, cmds }) => {
    const rows = cmds.map(([cmd, desc]) =>
      `│ ${cmd.padEnd(14)} ${desc}`
    ).join('\n');
    return `\n┌─「 *${title}* 」\n${rows}\n└────────────────────────────`;
  }).join('\n');

  const footer = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ *XMD-TECH* powered by ADEZ Tech
🌍 Nairobi, Kenya · adeztech.co.ke
> _${getTotalCommands(sections)} commands · Type ${p}help <cmd>_`;

  return header + body + footer;
}

function getTotalCommands(sections) {
  return sections.reduce((acc, s) => acc + s.cmds.length, 0);
}

function detectPlatform() {
  if (process.env.RAILWAY_ENVIRONMENT) return 'Railway';
  if (process.env.DYNO)               return 'Heroku';
  if (process.env.RENDER)             return 'Render';
  if (process.env.PREFIX?.includes('termux')) return 'Termux';
  return require('os').platform() === 'win32' ? 'Windows' : 'Linux';
}

// ─── SEND MENU ────────────────────────────────────────────────────────────────

/**
 * Send the XMD-TECH menu to a WhatsApp chat
 * @param {object} sock   - Baileys socket
 * @param {string} jid    - Chat JID
 * @param {string} owner  - Bot owner name
 * @param {string} prefix - Command prefix (default '.')
 */
async function sendMenu(sock, jid, owner = 'Arnold', prefix = '.') {
  const text = buildMenu(owner, prefix);
  await sock.sendMessage(jid, { text });
}

// ─── EXPORTS ──────────────────────────────────────────────────────────────────

module.exports = { sendMenu, buildMenu };

// ─── PREVIEW (run directly: node menu.js) ─────────────────────────────────────

if (require.main === module) {
  console.log(buildMenu('Arnold', '.'));
}
