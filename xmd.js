/**
 * ╔══════════════════════════════════════════════╗
 * ║          XMD-TECH WhatsApp Bot               ║
 * ║           Full Bot Core · xmd.js             ║
 * ║         Built by ADEZ Tech · Nairobi         ║
 * ╚══════════════════════════════════════════════╝
 */

'use strict';

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeInMemoryStore,
  jidDecode,
  proto,
  getContentType,
} = require('@whiskeysockets/baileys');

const pino        = require('pino');
const path        = require('path');
const fs          = require('fs');
const axios       = require('axios');
const { Boom }    = require('@hapi/boom');
const { sendMenu } = require('./menu');
require('dotenv').config();

// ─── CONFIG ──────────────────────────────────────────────────────────────────

const PREFIX       = process.env.PREFIX       || '.';
const OWNER_NUMBER = process.env.OWNER_NUMBER || '254700000000';
const OWNER_NAME   = process.env.OWNER_NAME   || 'Arnold';
const BOT_NAME     = process.env.BOT_NAME     || 'XMD-TECH';
const SESSION_DIR  = './src/Session';
const VERSION      = '2.0.0';

const OWNER_JID = OWNER_NUMBER.replace(/[^0-9]/g, '') + '@s.whatsapp.net';

// ─── STORE ───────────────────────────────────────────────────────────────────

const store = makeInMemoryStore({
  logger: pino({ level: 'silent' }),
});

// ─── LOGGER ──────────────────────────────────────────────────────────────────

function log(msg, level = 'info') {
  const icons = { info: '◈', success: '✓', warn: '⚠', error: '✗' };
  const colors = { info: '\x1b[96m', success: '\x1b[92m', warn: '\x1b[93m', error: '\x1b[91m' };
  const c = colors[level] || colors.info;
  const i = icons[level]  || '◈';
  console.log(`${c}${i} [XMD-TECH]\x1b[0m ${msg}`);
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function isOwner(jid) {
  return jid.replace('@s.whatsapp.net', '') === OWNER_NUMBER.replace(/[^0-9]/g, '');
}

function isGroup(jid) {
  return jid.endsWith('@g.us');
}

async function react(sock, msg, emoji) {
  await sock.sendMessage(msg.key.remoteJid, {
    react: { text: emoji, key: msg.key },
  });
}

async function reply(sock, msg, text) {
  return sock.sendMessage(msg.key.remoteJid, { text }, { quoted: msg });
}

async function sendText(sock, jid, text) {
  return sock.sendMessage(jid, { text });
}

function getMsgType(msg) {
  const m = msg.message;
  if (!m) return null;
  return getContentType(m);
}

function getBody(msg) {
  const type = getMsgType(msg);
  if (!type) return '';
  const m = msg.message;
  if (type === 'conversation')            return m.conversation;
  if (type === 'extendedTextMessage')     return m.extendedTextMessage.text;
  if (type === 'imageMessage')            return m.imageMessage.caption || '';
  if (type === 'videoMessage')            return m.videoMessage.caption || '';
  if (type === 'buttonsResponseMessage')  return m.buttonsResponseMessage.selectedButtonId;
  if (type === 'listResponseMessage')     return m.listResponseMessage.singleSelectReply.selectedRowId;
  return '';
}

function getSender(msg) {
  return msg.key.fromMe
    ? msg.key.remoteJid
    : (msg.key.participant || msg.key.remoteJid);
}

async function downloadMedia(msg, type) {
  const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
  const m = msg.message[type + 'Message'] || msg.message;
  const stream = await downloadContentFromMessage(m, type);
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

// Warn store (in-memory; replace with DB for persistence)
const warnStore = {};

function addWarn(jid, target) {
  if (!warnStore[jid]) warnStore[jid] = {};
  if (!warnStore[jid][target]) warnStore[jid][target] = 0;
  warnStore[jid][target]++;
  return warnStore[jid][target];
}

function getWarn(jid, target) {
  return (warnStore[jid] || {})[target] || 0;
}

function clearWarn(jid, target) {
  if (warnStore[jid]) warnStore[jid][target] = 0;
}

// ─── COMMAND HANDLERS ─────────────────────────────────────────────────────────

const commands = {};

function cmd(name, handler) {
  commands[name.toLowerCase()] = handler;
}

// ══════════════════════════════════════════════════════════
//  🤖  AI & INTELLIGENCE
// ══════════════════════════════════════════════════════════

cmd('ai', async ({ sock, msg, args, text }) => {
  if (!text) return reply(sock, msg, `Usage: ${PREFIX}ai What is AI?`);
  await react(sock, msg, '🤖');
  try {
    const res = await axios.post('https://api.anthropic.com/v1/messages', {
      model:      'claude-sonnet-4-6',
      max_tokens: 1024,
      messages:   [{ role: 'user', content: text }],
    }, {
      headers: {
        'x-api-key':         process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type':      'application/json',
      },
    });
    const answer = res.data.content[0].text;
    await reply(sock, msg, `🤖 *XMD-TECH AI*\n\n${answer}`);
  } catch (e) {
    await reply(sock, msg, `❌ AI error: ${e.message}`);
  }
});

cmd('gpt', async ({ sock, msg, text }) => {
  if (!text) return reply(sock, msg, `Usage: ${PREFIX}gpt Explain blockchain`);
  await react(sock, msg, '💡');
  try {
    const res = await axios.post('https://api.openai.com/v1/chat/completions', {
      model:    'gpt-4o',
      messages: [{ role: 'user', content: text }],
    }, {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    });
    await reply(sock, msg, `💡 *GPT-4o*\n\n${res.data.choices[0].message.content}`);
  } catch (e) {
    await reply(sock, msg, `❌ GPT error: ${e.message}`);
  }
});

cmd('imagine', async ({ sock, msg, text }) => {
  if (!text) return reply(sock, msg, `Usage: ${PREFIX}imagine a futuristic Nairobi`);
  await react(sock, msg, '🎨');
  try {
    const res = await axios.post('https://api.openai.com/v1/images/generations', {
      model:  'dall-e-3',
      prompt: text,
      n:      1,
      size:   '1024x1024',
    }, {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    });
    const url = res.data.data[0].url;
    const img = await axios.get(url, { responseType: 'arraybuffer' });
    await sock.sendMessage(msg.key.remoteJid, {
      image:   Buffer.from(img.data),
      caption: `🎨 *${text}*\n\n_Generated by XMD-TECH_`,
    }, { quoted: msg });
  } catch (e) {
    await reply(sock, msg, `❌ Image error: ${e.message}`);
  }
});

cmd('translate', async ({ sock, msg, args, text }) => {
  if (args.length < 2) return reply(sock, msg, `Usage: ${PREFIX}translate en Habari yako`);
  const [lang, ...rest] = args;
  const toTranslate = rest.join(' ');
  await react(sock, msg, '🌐');
  try {
    const res = await axios.get('https://api.mymemory.translated.net/get', {
      params: { q: toTranslate, langpair: `auto|${lang}` },
    });
    const translated = res.data.responseData.translatedText;
    await reply(sock, msg, `🌐 *Translation (${lang})*\n\n${translated}`);
  } catch (e) {
    await reply(sock, msg, `❌ Translate error: ${e.message}`);
  }
});

cmd('summarize', async ({ sock, msg, text }) => {
  if (!text) return reply(sock, msg, `Usage: ${PREFIX}summarize [paste long text]`);
  await react(sock, msg, '📝');
  try {
    const res = await axios.post('https://api.anthropic.com/v1/messages', {
      model:      'claude-sonnet-4-6',
      max_tokens: 512,
      messages:   [{ role: 'user', content: `Summarize this in bullet points:\n\n${text}` }],
    }, {
      headers: {
        'x-api-key':         process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type':      'application/json',
      },
    });
    await reply(sock, msg, `📝 *Summary*\n\n${res.data.content[0].text}`);
  } catch (e) {
    await reply(sock, msg, `❌ Summarize error: ${e.message}`);
  }
});

cmd('analyze', async ({ sock, msg, text }) => {
  await react(sock, msg, '🔍');
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const imgMsg = quoted?.imageMessage || msg.message?.imageMessage;
  if (!imgMsg) return reply(sock, msg, `Send an image then reply with ${PREFIX}analyze`);
  try {
    const buf  = await downloadMedia({ message: { imageMessage: imgMsg } }, 'image');
    const b64  = buf.toString('base64');
    const res  = await axios.post('https://api.anthropic.com/v1/messages', {
      model:      'claude-sonnet-4-6',
      max_tokens: 512,
      messages:   [{
        role:    'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: b64 } },
          { type: 'text',  text:   text || 'Describe this image in detail.' },
        ],
      }],
    }, {
      headers: {
        'x-api-key':         process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type':      'application/json',
      },
    });
    await reply(sock, msg, `🔍 *AI Analysis*\n\n${res.data.content[0].text}`);
  } catch (e) {
    await reply(sock, msg, `❌ Analyze error: ${e.message}`);
  }
});

cmd('search', async ({ sock, msg, text }) => {
  if (!text) return reply(sock, msg, `Usage: ${PREFIX}search latest Kenya news`);
  await react(sock, msg, '🔍');
  try {
    const res = await axios.get(`https://ddg-api.herokuapp.com/search`, {
      params: { query: text, limit: 5 },
    });
    const results = res.data.map((r, i) =>
      `*${i + 1}. ${r.title}*\n${r.snippet}\n🔗 ${r.link}`
    ).join('\n\n');
    await reply(sock, msg, `🔍 *Search: ${text}*\n\n${results}`);
  } catch (e) {
    await reply(sock, msg, `❌ Search error: ${e.message}`);
  }
});

cmd('ideas', async ({ sock, msg, text }) => {
  if (!text) return reply(sock, msg, `Usage: ${PREFIX}ideas business names for a salon`);
  await react(sock, msg, '💡');
  try {
    const res = await axios.post('https://api.anthropic.com/v1/messages', {
      model:      'claude-sonnet-4-6',
      max_tokens: 512,
      messages:   [{ role: 'user', content: `Give me 10 creative ideas for: ${text}` }],
    }, {
      headers: {
        'x-api-key':         process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type':      'application/json',
      },
    });
    await reply(sock, msg, `💡 *Ideas for: ${text}*\n\n${res.data.content[0].text}`);
  } catch (e) {
    await reply(sock, msg, `❌ Ideas error: ${e.message}`);
  }
});

cmd('jarvis', async ({ sock, msg, text }) => {
  if (!text) return reply(sock, msg, `Usage: ${PREFIX}jarvis plan my week`);
  await react(sock, msg, '🤖');
  try {
    const system = `You are Jarvis, the AI assistant for XMD-TECH WhatsApp bot. You are helpful, smart, and concise. Owner: ${OWNER_NAME}. Bot: ${BOT_NAME}.`;
    const res = await axios.post('https://api.anthropic.com/v1/messages', {
      model:      'claude-sonnet-4-6',
      max_tokens: 1024,
      system,
      messages:   [{ role: 'user', content: text }],
    }, {
      headers: {
        'x-api-key':         process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type':      'application/json',
      },
    });
    await reply(sock, msg, `🤖 *Jarvis*\n\n${res.data.content[0].text}`);
  } catch (e) {
    await reply(sock, msg, `❌ Jarvis error: ${e.message}`);
  }
});

// ══════════════════════════════════════════════════════════
//  📥  MEDIA DOWNLOADER
// ══════════════════════════════════════════════════════════

cmd('ytmp4', async ({ sock, msg, text }) => {
  if (!text) return reply(sock, msg, `Usage: ${PREFIX}ytmp4 [youtube url]`);
  await react(sock, msg, '⏳');
  try {
    const res = await axios.get(`https://api.botcahx.eu.org/api/download/ytmp4?url=${encodeURIComponent(text)}`);
    const { title, download } = res.data.result;
    await reply(sock, msg, `📥 *${title}*\n\n🔗 ${download}\n\n_Download link valid for 30 mins_`);
  } catch (e) {
    await reply(sock, msg, `❌ YouTube error: ${e.message}`);
  }
});

cmd('ytmp3', async ({ sock, msg, text }) => {
  if (!text) return reply(sock, msg, `Usage: ${PREFIX}ytmp3 [youtube url]`);
  await react(sock, msg, '⏳');
  try {
    const res = await axios.get(`https://api.botcahx.eu.org/api/download/ytmp3?url=${encodeURIComponent(text)}`);
    const { title, download } = res.data.result;
    await reply(sock, msg, `🎵 *${title}*\n\n🔗 ${download}`);
  } catch (e) {
    await reply(sock, msg, `❌ YouTube MP3 error: ${e.message}`);
  }
});

cmd('ig', async ({ sock, msg, text }) => {
  if (!text) return reply(sock, msg, `Usage: ${PREFIX}ig [instagram url]`);
  await react(sock, msg, '⏳');
  try {
    const res = await axios.get(`https://api.botcahx.eu.org/api/download/ig?url=${encodeURIComponent(text)}`);
    const url = res.data.result?.url || res.data.result?.[0]?.url;
    if (!url) throw new Error('No media found');
    await reply(sock, msg, `📸 *Instagram Media*\n\n🔗 ${url}`);
  } catch (e) {
    await reply(sock, msg, `❌ Instagram error: ${e.message}`);
  }
});

cmd('tiktok', async ({ sock, msg, text }) => {
  if (!text) return reply(sock, msg, `Usage: ${PREFIX}tiktok [tiktok url]`);
  await react(sock, msg, '⏳');
  try {
    const res = await axios.get(`https://api.botcahx.eu.org/api/download/tiktok?url=${encodeURIComponent(text)}`);
    const url = res.data.result?.nowm || res.data.result?.url;
    if (!url) throw new Error('No media found');
    await reply(sock, msg, `🎭 *TikTok (No Watermark)*\n\n🔗 ${url}`);
  } catch (e) {
    await reply(sock, msg, `❌ TikTok error: ${e.message}`);
  }
});

cmd('twitter', async ({ sock, msg, text }) => {
  if (!text) return reply(sock, msg, `Usage: ${PREFIX}twitter [tweet url]`);
  await react(sock, msg, '⏳');
  try {
    const res = await axios.get(`https://api.botcahx.eu.org/api/download/twitter?url=${encodeURIComponent(text)}`);
    const url = res.data.result?.url || res.data.result?.[0]?.url;
    await reply(sock, msg, `🐦 *Twitter/X Media*\n\n🔗 ${url}`);
  } catch (e) {
    await reply(sock, msg, `❌ Twitter error: ${e.message}`);
  }
});

cmd('spotify', async ({ sock, msg, text }) => {
  if (!text) return reply(sock, msg, `Usage: ${PREFIX}spotify [spotify track url]`);
  await react(sock, msg, '⏳');
  try {
    const res = await axios.get(`https://api.botcahx.eu.org/api/download/spotify?url=${encodeURIComponent(text)}`);
    const { title, download } = res.data.result;
    await reply(sock, msg, `🎧 *${title}*\n\n🔗 ${download}`);
  } catch (e) {
    await reply(sock, msg, `❌ Spotify error: ${e.message}`);
  }
});

cmd('fb', async ({ sock, msg, text }) => {
  if (!text) return reply(sock, msg, `Usage: ${PREFIX}fb [facebook url]`);
  await react(sock, msg, '⏳');
  try {
    const res = await axios.get(`https://api.botcahx.eu.org/api/download/facebook?url=${encodeURIComponent(text)}`);
    const url = res.data.result?.hd || res.data.result?.sd;
    await reply(sock, msg, `📱 *Facebook Video*\n\n🔗 ${url}`);
  } catch (e) {
    await reply(sock, msg, `❌ Facebook error: ${e.message}`);
  }
});

cmd('pin', async ({ sock, msg, text }) => {
  if (!text) return reply(sock, msg, `Usage: ${PREFIX}pin [pinterest url]`);
  await react(sock, msg, '⏳');
  try {
    const res = await axios.get(`https://api.botcahx.eu.org/api/download/pinterest?url=${encodeURIComponent(text)}`);
    const url = res.data.result?.url;
    await reply(sock, msg, `📌 *Pinterest Media*\n\n🔗 ${url}`);
  } catch (e) {
    await reply(sock, msg, `❌ Pinterest error: ${e.message}`);
  }
});

cmd('song', async ({ sock, msg, text }) => {
  if (!text) return reply(sock, msg, `Usage: ${PREFIX}song Sauti Sol Extravaganza`);
  await react(sock, msg, '🎵');
  try {
    const search = await axios.get(`https://api.botcahx.eu.org/api/search/youtube?q=${encodeURIComponent(text)}`);
    const first  = search.data.result?.[0];
    if (!first) throw new Error('No results found');
    const dl = await axios.get(`https://api.botcahx.eu.org/api/download/ytmp3?url=${encodeURIComponent(first.url)}`);
    await reply(sock, msg, `🎵 *${first.title}*\n⏱ ${first.duration}\n\n🔗 ${dl.data.result?.download}`);
  } catch (e) {
    await reply(sock, msg, `❌ Song error: ${e.message}`);
  }
});

cmd('sticker', async ({ sock, msg }) => {
  await react(sock, msg, '⏳');
  try {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const imgMsg = quoted?.imageMessage || msg.message?.imageMessage;
    const vidMsg = quoted?.videoMessage || msg.message?.videoMessage;

    if (!imgMsg && !vidMsg) return reply(sock, msg, `Send an image/video then reply with ${PREFIX}sticker`);

    if (imgMsg) {
      const buf = await downloadMedia({ message: { imageMessage: imgMsg } }, 'image');
      await sock.sendMessage(msg.key.remoteJid, {
        sticker: buf,
      }, { quoted: msg });
    } else {
      await reply(sock, msg, '❌ Video stickers require ffmpeg. Send an image instead.');
    }
  } catch (e) {
    await reply(sock, msg, `❌ Sticker error: ${e.message}`);
  }
});

// ══════════════════════════════════════════════════════════
//  👑  GROUP MANAGEMENT
// ══════════════════════════════════════════════════════════

cmd('kick', async ({ sock, msg, args, jid, isGroupMsg }) => {
  if (!isGroupMsg) return reply(sock, msg, '❌ Group only command');
  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
  const target    = mentioned?.[0] || (args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);
  if (!target) return reply(sock, msg, `Usage: ${PREFIX}kick @user`);
  try {
    await sock.groupParticipantsUpdate(jid, [target], 'remove');
    await reply(sock, msg, `✅ Removed ${target.split('@')[0]} from the group.`);
  } catch (e) {
    await reply(sock, msg, `❌ Kick error: ${e.message}`);
  }
});

cmd('promote', async ({ sock, msg, args, jid, isGroupMsg }) => {
  if (!isGroupMsg) return reply(sock, msg, '❌ Group only command');
  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
  const target    = mentioned?.[0] || (args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);
  if (!target) return reply(sock, msg, `Usage: ${PREFIX}promote @user`);
  try {
    await sock.groupParticipantsUpdate(jid, [target], 'promote');
    await reply(sock, msg, `⭐ Promoted ${target.split('@')[0]} to admin!`);
  } catch (e) {
    await reply(sock, msg, `❌ Promote error: ${e.message}`);
  }
});

cmd('demote', async ({ sock, msg, args, jid, isGroupMsg }) => {
  if (!isGroupMsg) return reply(sock, msg, '❌ Group only command');
  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
  const target    = mentioned?.[0] || (args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);
  if (!target) return reply(sock, msg, `Usage: ${PREFIX}demote @user`);
  try {
    await sock.groupParticipantsUpdate(jid, [target], 'demote');
    await reply(sock, msg, `🔽 Demoted ${target.split('@')[0]} from admin.`);
  } catch (e) {
    await reply(sock, msg, `❌ Demote error: ${e.message}`);
  }
});

cmd('mute', async ({ sock, msg, jid, isGroupMsg }) => {
  if (!isGroupMsg) return reply(sock, msg, '❌ Group only command');
  try {
    await sock.groupSettingUpdate(jid, 'announcement');
    await reply(sock, msg, '🔇 Group muted — only admins can send messages.');
  } catch (e) {
    await reply(sock, msg, `❌ Mute error: ${e.message}`);
  }
});

cmd('unmute', async ({ sock, msg, jid, isGroupMsg }) => {
  if (!isGroupMsg) return reply(sock, msg, '❌ Group only command');
  try {
    await sock.groupSettingUpdate(jid, 'not_announcement');
    await reply(sock, msg, '🔊 Group unmuted — everyone can send messages.');
  } catch (e) {
    await reply(sock, msg, `❌ Unmute error: ${e.message}`);
  }
});

// Anti-link store
const antiLinkGroups = new Set();

cmd('antilink', async ({ sock, msg, args, jid, isGroupMsg }) => {
  if (!isGroupMsg) return reply(sock, msg, '❌ Group only command');
  const arg = args[0]?.toLowerCase();
  if (arg === 'on') {
    antiLinkGroups.add(jid);
    await reply(sock, msg, '🔗 Anti-link *enabled* — links will be deleted.');
  } else if (arg === 'off') {
    antiLinkGroups.delete(jid);
    await reply(sock, msg, '🔗 Anti-link *disabled*.');
  } else {
    await reply(sock, msg, `Usage: ${PREFIX}antilink on/off`);
  }
});

// Anti-spam store
const antiSpamGroups  = new Set();
const spamTracker     = {};

cmd('antispam', async ({ sock, msg, args, jid, isGroupMsg }) => {
  if (!isGroupMsg) return reply(sock, msg, '❌ Group only command');
  const arg = args[0]?.toLowerCase();
  if (arg === 'on') {
    antiSpamGroups.add(jid);
    await reply(sock, msg, '🚫 Anti-spam *enabled* — spammers will be warned and kicked.');
  } else if (arg === 'off') {
    antiSpamGroups.delete(jid);
    await reply(sock, msg, '🚫 Anti-spam *disabled*.');
  } else {
    await reply(sock, msg, `Usage: ${PREFIX}antispam on/off`);
  }
});

// Welcome store
const welcomeGroups = new Set();

cmd('welcome', async ({ sock, msg, args, jid, isGroupMsg }) => {
  if (!isGroupMsg) return reply(sock, msg, '❌ Group only command');
  const arg = args[0]?.toLowerCase();
  if (arg === 'on') {
    welcomeGroups.add(jid);
    await reply(sock, msg, '👋 Welcome messages *enabled*.');
  } else {
    welcomeGroups.delete(jid);
    await reply(sock, msg, '👋 Welcome messages *disabled*.');
  }
});

// Goodbye store
const goodbyeGroups = new Set();

cmd('goodbye', async ({ sock, msg, args, jid, isGroupMsg }) => {
  if (!isGroupMsg) return reply(sock, msg, '❌ Group only command');
  const arg = args[0]?.toLowerCase();
  if (arg === 'on') {
    goodbyeGroups.add(jid);
    await reply(sock, msg, '🚪 Goodbye messages *enabled*.');
  } else {
    goodbyeGroups.delete(jid);
    await reply(sock, msg, '🚪 Goodbye messages *disabled*.');
  }
});

cmd('tagall', async ({ sock, msg, text, jid, isGroupMsg }) => {
  if (!isGroupMsg) return reply(sock, msg, '❌ Group only command');
  try {
    const meta    = await sock.groupMetadata(jid);
    const members = meta.participants.map(p => p.id);
    const mentions = members;
    const mention  = members.map(m => `@${m.split('@')[0]}`).join(' ');
    await sock.sendMessage(jid, {
      text:     `📢 *${text || 'Attention everyone!'}*\n\n${mention}`,
      mentions,
    }, { quoted: msg });
  } catch (e) {
    await reply(sock, msg, `❌ Tagall error: ${e.message}`);
  }
});

cmd('groupinfo', async ({ sock, msg, jid, isGroupMsg }) => {
  if (!isGroupMsg) return reply(sock, msg, '❌ Group only command');
  try {
    const meta    = await sock.groupMetadata(jid);
    const admins  = meta.participants.filter(p => p.admin).map(p => p.id.split('@')[0]).join(', ');
    const created = new Date(meta.creation * 1000).toLocaleDateString('en-KE');
    await reply(sock, msg,
      `📋 *Group Info*\n\n` +
      `*Name:* ${meta.subject}\n` +
      `*Members:* ${meta.participants.length}\n` +
      `*Admins:* ${admins}\n` +
      `*Created:* ${created}\n` +
      `*Description:* ${meta.desc || 'None'}`
    );
  } catch (e) {
    await reply(sock, msg, `❌ Groupinfo error: ${e.message}`);
  }
});

cmd('revoke', async ({ sock, msg, jid, isGroupMsg }) => {
  if (!isGroupMsg) return reply(sock, msg, '❌ Group only command');
  try {
    const code = await sock.groupInviteCode(jid);
    await sock.groupRevokeInvite(jid);
    const newCode = await sock.groupInviteCode(jid);
    await reply(sock, msg, `🔗 *Invite link reset!*\n\nhttps://chat.whatsapp.com/${newCode}`);
  } catch (e) {
    await reply(sock, msg, `❌ Revoke error: ${e.message}`);
  }
});

cmd('setname', async ({ sock, msg, text, jid, isGroupMsg }) => {
  if (!isGroupMsg) return reply(sock, msg, '❌ Group only command');
  if (!text) return reply(sock, msg, `Usage: ${PREFIX}setname New Group Name`);
  try {
    await sock.groupUpdateSubject(jid, text);
    await reply(sock, msg, `✅ Group name changed to *${text}*`);
  } catch (e) {
    await reply(sock, msg, `❌ Setname error: ${e.message}`);
  }
});

cmd('setdp', async ({ sock, msg, jid, isGroupMsg }) => {
  if (!isGroupMsg) return reply(sock, msg, '❌ Group only command');
  try {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const imgMsg = quoted?.imageMessage || msg.message?.imageMessage;
    if (!imgMsg) return reply(sock, msg, `Send an image then reply with ${PREFIX}setdp`);
    const buf = await downloadMedia({ message: { imageMessage: imgMsg } }, 'image');
    await sock.updateProfilePicture(jid, buf);
    await reply(sock, msg, '✅ Group picture updated!');
  } catch (e) {
    await reply(sock, msg, `❌ Setdp error: ${e.message}`);
  }
});

cmd('warn', async ({ sock, msg, args, text, jid, isGroupMsg }) => {
  if (!isGroupMsg) return reply(sock, msg, '❌ Group only command');
  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
  const target    = mentioned?.[0];
  if (!target) return reply(sock, msg, `Usage: ${PREFIX}warn @user reason`);
  const reason  = args.slice(1).join(' ') || 'No reason given';
  const count   = addWarn(jid, target);
  if (count >= 3) {
    await sock.groupParticipantsUpdate(jid, [target], 'remove');
    clearWarn(jid, target);
    return reply(sock, msg, `🚨 @${target.split('@')[0]} has been *kicked* after 3 warnings!`, { mentions: [target] });
  }
  await reply(sock, msg,
    `⚠️ *Warning ${count}/3*\n\n` +
    `@${target.split('@')[0]} — ${reason}\n` +
    `_${3 - count} more warning(s) will result in removal._`
  );
});

// ══════════════════════════════════════════════════════════
//  🛠️  UTILITY TOOLS
// ══════════════════════════════════════════════════════════

cmd('forex', async ({ sock, msg, args }) => {
  if (args.length < 2) return reply(sock, msg, `Usage: ${PREFIX}forex USD KES 100`);
  const [from, to, amount = '1'] = args;
  try {
    const res = await axios.get(`https://api.exchangerate.host/convert?from=${from.toUpperCase()}&to=${to.toUpperCase()}&amount=${amount}`);
    const { result, info } = res.data;
    await reply(sock, msg,
      `💰 *Forex Rate*\n\n` +
      `${amount} ${from.toUpperCase()} = *${result?.toFixed(2)} ${to.toUpperCase()}*\n` +
      `Rate: 1 ${from.toUpperCase()} = ${info?.rate?.toFixed(4)} ${to.toUpperCase()}`
    );
  } catch (e) {
    await reply(sock, msg, `❌ Forex error: ${e.message}`);
  }
});

cmd('weather', async ({ sock, msg, text }) => {
  if (!text) return reply(sock, msg, `Usage: ${PREFIX}weather Nairobi`);
  try {
    const res = await axios.get(`https://wttr.in/${encodeURIComponent(text)}?format=3`);
    await reply(sock, msg, `⛅ *Weather*\n\n${res.data}`);
  } catch (e) {
    await reply(sock, msg, `❌ Weather error: ${e.message}`);
  }
});

cmd('mpesa', async ({ sock, msg, args }) => {
  const action = args[0]?.toLowerCase();
  const amount = parseFloat(args[1]);
  if (!action || !amount) return reply(sock, msg, `Usage: ${PREFIX}mpesa send 5000`);

  // M-Pesa 2024 tariffs (approximate)
  const tariff = (amt) => {
    if (amt <= 100)    return { send: 0,  withdraw: 10  };
    if (amt <= 500)    return { send: 7,  withdraw: 28  };
    if (amt <= 1000)   return { send: 13, withdraw: 28  };
    if (amt <= 1500)   return { send: 23, withdraw: 28  };
    if (amt <= 2500)   return { send: 33, withdraw: 28  };
    if (amt <= 3500)   return { send: 53, withdraw: 52  };
    if (amt <= 5000)   return { send: 57, withdraw: 69  };
    if (amt <= 7500)   return { send: 78, withdraw: 87  };
    if (amt <= 10000)  return { send: 90, withdraw: 115 };
    if (amt <= 15000)  return { send: 100, withdraw: 167 };
    if (amt <= 20000)  return { send: 105, withdraw: 185 };
    if (amt <= 35000)  return { send: 108, withdraw: 197 };
    return { send: 108, withdraw: 309 };
  };

  const t    = tariff(amount);
  const fee  = action === 'withdraw' ? t.withdraw : t.send;
  await reply(sock, msg,
    `📊 *M-Pesa Charges*\n\n` +
    `Amount: KES ${amount.toLocaleString()}\n` +
    `Action: ${action.toUpperCase()}\n` +
    `Fee: *KES ${fee}*\n` +
    `Total: KES ${(amount + fee).toLocaleString()}`
  );
});

cmd('kplc', async ({ sock, msg, text }) => {
  if (!text) return reply(sock, msg, `Usage: ${PREFIX}kplc [meter number]`);
  await react(sock, msg, '⚡');
  await reply(sock, msg,
    `⚡ *KPLC Meter: ${text}*\n\n` +
    `_Visit_ https://selfservice.kplc.co.ke _to check your token balance and purchase units._\n\n` +
    `📞 *KPLC Helpline:* 0703070707`
  );
});

cmd('calc', async ({ sock, msg, text }) => {
  if (!text) return reply(sock, msg, `Usage: ${PREFIX}calc 25 * 4 + 10`);
  try {
    // Safe eval using mathjs-like approach
    const sanitized = text.replace(/[^0-9+\-*/.() %^]/g, '');
    const result    = Function(`"use strict"; return (${sanitized})`)();
    await reply(sock, msg, `🔢 *Calculator*\n\n${text}\n= *${result}*`);
  } catch (e) {
    await reply(sock, msg, `❌ Invalid expression: ${text}`);
  }
});

const reminders = {};

cmd('remind', async ({ sock, msg, args, text }) => {
  if (args.length < 2) return reply(sock, msg, `Usage: ${PREFIX}remind 30m Take medicine`);
  const timeStr  = args[0];
  const reminder = args.slice(1).join(' ');
  const match    = timeStr.match(/^(\d+)(s|m|h)$/);
  if (!match) return reply(sock, msg, '❌ Use format: 30s, 5m, 2h');

  const value = parseInt(match[1]);
  const unit  = match[2];
  const ms    = unit === 's' ? value * 1000 : unit === 'm' ? value * 60000 : value * 3600000;

  await reply(sock, msg, `⏰ Reminder set for *${timeStr}*: ${reminder}`);
  setTimeout(async () => {
    await sock.sendMessage(msg.key.remoteJid, {
      text: `⏰ *Reminder!*\n\n${reminder}`,
    }, { quoted: msg });
  }, ms);
});

cmd('news', async ({ sock, msg, text }) => {
  await react(sock, msg, '📰');
  const query = text || 'Kenya';
  try {
    const res = await axios.get(`https://newsapi.org/v2/everything`, {
      params: { q: query, pageSize: 5, language: 'en', sortBy: 'publishedAt' },
      headers: { 'X-Api-Key': process.env.NEWS_API_KEY || '' },
    });
    if (!res.data.articles?.length) throw new Error('No articles found');
    const headlines = res.data.articles
      .map((a, i) => `*${i + 1}. ${a.title}*\n${a.source.name} · ${new Date(a.publishedAt).toLocaleDateString()}\n🔗 ${a.url}`)
      .join('\n\n');
    await reply(sock, msg, `📰 *News: ${query}*\n\n${headlines}`);
  } catch (e) {
    await reply(sock, msg, `❌ News error: ${e.message}\n_Set NEWS_API_KEY in .env for live news_`);
  }
});

cmd('track', async ({ sock, msg, text }) => {
  if (!text) return reply(sock, msg, `Usage: ${PREFIX}track [tracking number]`);
  await reply(sock, msg,
    `📦 *Parcel Tracker*\n\n` +
    `Tracking: *${text}*\n\n` +
    `Track at:\n` +
    `• 🌍 https://www.17track.net/en?nums=${text}\n` +
    `• 🇰🇪 https://www.posta.co.ke/track?id=${text}`
  );
});

cmd('password', async ({ sock, msg, args }) => {
  const length = parseInt(args[0]) || 16;
  const chars  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}';
  const pwd    = Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  await reply(sock, msg, `🔐 *Generated Password (${length} chars)*\n\n\`${pwd}\`\n\n_Keep this safe!_`);
});

cmd('qr', async ({ sock, msg, text }) => {
  if (!text) return reply(sock, msg, `Usage: ${PREFIX}qr https://adeztech.co.ke`);
  await react(sock, msg, '📌');
  try {
    const url = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(text)}&size=300x300`;
    const img = await axios.get(url, { responseType: 'arraybuffer' });
    await sock.sendMessage(msg.key.remoteJid, {
      image:   Buffer.from(img.data),
      caption: `📌 *QR Code*\n${text}`,
    }, { quoted: msg });
  } catch (e) {
    await reply(sock, msg, `❌ QR error: ${e.message}`);
  }
});

cmd('shorturl', async ({ sock, msg, text }) => {
  if (!text) return reply(sock, msg, `Usage: ${PREFIX}shorturl [long url]`);
  try {
    const res = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(text)}`);
    await reply(sock, msg, `🔗 *Short URL*\n\nOriginal: ${text}\nShortened: *${res.data}*`);
  } catch (e) {
    await reply(sock, msg, `❌ URL error: ${e.message}`);
  }
});

cmd('ip', async ({ sock, msg, text }) => {
  if (!text) return reply(sock, msg, `Usage: ${PREFIX}ip 8.8.8.8`);
  try {
    const res = await axios.get(`https://ipinfo.io/${text}/json`);
    const d   = res.data;
    await reply(sock, msg,
      `🌐 *IP Lookup: ${text}*\n\n` +
      `City: ${d.city || 'N/A'}\n` +
      `Region: ${d.region || 'N/A'}\n` +
      `Country: ${d.country || 'N/A'}\n` +
      `ISP: ${d.org || 'N/A'}\n` +
      `Timezone: ${d.timezone || 'N/A'}`
    );
  } catch (e) {
    await reply(sock, msg, `❌ IP error: ${e.message}`);
  }
});

// ══════════════════════════════════════════════════════════
//  🎨  MEDIA & CONVERSION
// ══════════════════════════════════════════════════════════

cmd('toimg', async ({ sock, msg }) => {
  try {
    const quoted  = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const stickerMsg = quoted?.stickerMessage || msg.message?.stickerMessage;
    if (!stickerMsg) return reply(sock, msg, `Reply to a sticker with ${PREFIX}toimg`);
    const buf = await downloadMedia({ message: { stickerMessage: stickerMsg } }, 'sticker');
    await sock.sendMessage(msg.key.remoteJid, { image: buf, caption: '🖼️ Converted from sticker' }, { quoted: msg });
  } catch (e) {
    await reply(sock, msg, `❌ Toimg error: ${e.message}`);
  }
});

cmd('togif', async ({ sock, msg }) => {
  await reply(sock, msg, '🎞️ Video to GIF requires ffmpeg. Please install ffmpeg on your server and implement video conversion in xmd.js.');
});

cmd('tts', async ({ sock, msg, args, text }) => {
  if (!text) return reply(sock, msg, `Usage: ${PREFIX}tts Hello from XMD-TECH`);
  const lang = args[0]?.length === 2 ? args[0] : 'en';
  const ttsText = lang === args[0] ? args.slice(1).join(' ') : text;
  try {
    const { GoogleTTS } = require('google-tts-api');
    const url = GoogleTTS.getAudioUrl(ttsText || text, { lang, slow: false, host: 'https://translate.google.com' });
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    await sock.sendMessage(msg.key.remoteJid, {
      audio:    Buffer.from(res.data),
      mimetype: 'audio/mp4',
      ptt:      true,
    }, { quoted: msg });
  } catch (e) {
    await reply(sock, msg, `❌ TTS error: ${e.message}`);
  }
});

cmd('transcribe', async ({ sock, msg }) => {
  await react(sock, msg, '📝');
  const quoted  = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const audioMsg = quoted?.audioMessage || msg.message?.audioMessage;
  if (!audioMsg) return reply(sock, msg, `Reply to a voice note with ${PREFIX}transcribe`);
  await reply(sock, msg, '🎙️ Transcription requires a speech-to-text API (Whisper/Google). Add OPENAI_API_KEY to .env for this feature.');
});

cmd('rotate', async ({ sock, msg, args }) => {
  await reply(sock, msg, '🔄 Image rotation requires sharp/jimp. Ensure jimp is installed and implement rotation handler.');
});

cmd('caption', async ({ sock, msg, text }) => {
  if (!text) return reply(sock, msg, `Usage: ${PREFIX}caption Top Text | Bottom Text`);
  await reply(sock, msg, '✍️ Caption overlay requires jimp. Ensure jimp is installed in package.json.');
});

cmd('emojimix', async ({ sock, msg, text }) => {
  if (!text) return reply(sock, msg, `Usage: ${PREFIX}emojimix 😂🔥`);
  const emojis = [...text].filter(c => c.codePointAt(0) > 127);
  if (emojis.length < 2) return reply(sock, msg, '❌ Send two emojis e.g. 😂🔥');
  try {
    const e1   = emojis[0].codePointAt(0).toString(16);
    const e2   = emojis[1].codePointAt(0).toString(16);
    const url  = `https://www.gstatic.com/android/keyboard/emojikitchen/20201001/u${e1}/u${e1}_u${e2}.png`;
    const img  = await axios.get(url, { responseType: 'arraybuffer' });
    await sock.sendMessage(msg.key.remoteJid, {
      image:   Buffer.from(img.data),
      caption: `🎭 ${emojis[0]} + ${emojis[1]} = 🎉`,
    }, { quoted: msg });
  } catch (e) {
    await reply(sock, msg, `❌ Emojimix not available for those emojis.`);
  }
});

cmd('resize', async ({ sock, msg, args }) => {
  await reply(sock, msg, '📐 Image resize requires jimp. Ensure jimp is installed in package.json.');
});

// ══════════════════════════════════════════════════════════
//  🎮  FUN & GAMES
// ══════════════════════════════════════════════════════════

cmd('joke', async ({ sock, msg }) => {
  const jokes = [
    'Why don\'t scientists trust atoms?\nBecause they make up everything! 😂',
    'I told my wife she was drawing her eyebrows too high.\nShe looked surprised. 😄',
    'Why did the scarecrow win an award?\nBecause he was outstanding in his field! 🌾',
    'I asked my phone why it was cold.\nIt said it had too many Windows open. 💻',
    'Why do programmers prefer dark mode?\nBecause light attracts bugs! 🐛',
    'What did the ocean say to the beach?\nNothing, it just waved! 🌊',
    'Why did the Kenyan cross the road?\nTo get to the other Matatu stage! 🚌',
  ];
  const joke = jokes[Math.floor(Math.random() * jokes.length)];
  await reply(sock, msg, `😂 *Joke of the Day*\n\n${joke}`);
});

cmd('quote', async ({ sock, msg }) => {
  try {
    const res  = await axios.get('https://api.quotable.io/random');
    const { content, author } = res.data;
    await reply(sock, msg, `💬 *Quote*\n\n_"${content}"_\n\n— *${author}*`);
  } catch {
    const quotes = [
      '"The secret of getting ahead is getting started." — Mark Twain',
      '"It always seems impossible until it\'s done." — Nelson Mandela',
      '"Success is not final; failure is not fatal." — Winston Churchill',
    ];
    await reply(sock, msg, `💬 *Quote*\n\n${quotes[Math.floor(Math.random() * quotes.length)]}`);
  }
});

const triviaStore = {};

cmd('trivia', async ({ sock, msg, jid }) => {
  await react(sock, msg, '🎯');
  try {
    const res      = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple');
    const q        = res.data.results[0];
    const answers  = [...q.incorrect_answers, q.correct_answer].sort(() => Math.random() - 0.5);
    const labels   = ['A', 'B', 'C', 'D'];
    const correct  = labels[answers.indexOf(q.correct_answer)];

    triviaStore[jid] = { answer: correct, expires: Date.now() + 30000 };

    const opts = answers.map((a, i) => `${labels[i]}. ${a}`).join('\n');
    await reply(sock, msg,
      `🎯 *Trivia*\n\n` +
      `*${q.question.replace(/&quot;/g, '"').replace(/&#039;/g, "'")}*\n\n${opts}\n\n_Reply A, B, C or D within 30s_`
    );
  } catch (e) {
    await reply(sock, msg, `❌ Trivia error: ${e.message}`);
  }
});

cmd('riddle', async ({ sock, msg }) => {
  const riddles = [
    { q: "I have cities, but no houses live there. I have mountains, but no trees grow there. I have water, but no fish swim there. What am I?", a: "A Map" },
    { q: "The more you take, the more you leave behind. What am I?", a: "Footsteps" },
    { q: "I speak without a mouth and hear without ears. I have no body, but I come alive with the wind. What am I?", a: "An Echo" },
    { q: "What has hands but can't clap?", a: "A Clock" },
    { q: "What gets wetter as it dries?", a: "A Towel" },
  ];
  const r = riddles[Math.floor(Math.random() * riddles.length)];
  await reply(sock, msg, `🧠 *Riddle*\n\n${r.q}\n\n_Reply_ ${PREFIX}answer _to reveal the answer_`);
  // Store answer temporarily
  triviaStore[msg.key.remoteJid + '_riddle'] = { answer: r.a, expires: Date.now() + 60000 };
});

cmd('answer', async ({ sock, msg, jid }) => {
  const key  = jid + '_riddle';
  const data = triviaStore[key];
  if (!data) return reply(sock, msg, '❌ No active riddle. Start one with ${PREFIX}riddle');
  await reply(sock, msg, `💡 *Answer:* ${data.answer}`);
  delete triviaStore[key];
});

const hangmanStore = {};
const hangmanWords = ['javascript', 'kenya', 'nairobi', 'mpesa', 'safaricom', 'technology', 'whatsapp', 'developer', 'computer', 'internet'];

cmd('hangman', async ({ sock, msg, jid }) => {
  const word    = hangmanWords[Math.floor(Math.random() * hangmanWords.length)];
  const guessed = [];
  hangmanStore[jid] = { word, guessed, tries: 6 };
  const display = word.split('').map(l => '_').join(' ');
  await reply(sock, msg, `🔠 *Hangman*\n\nWord: \`${display}\`\nTries left: 6\n\n_Reply_ ${PREFIX}guess a _to guess a letter_`);
});

cmd('guess', async ({ sock, msg, args, jid }) => {
  const game = hangmanStore[jid];
  if (!game) return reply(sock, msg, `No active game. Start with ${PREFIX}hangman`);
  const letter = args[0]?.toLowerCase();
  if (!letter || letter.length !== 1) return reply(sock, msg, `Usage: ${PREFIX}guess a`);
  if (game.guessed.includes(letter)) return reply(sock, msg, `You already guessed "${letter}"`);

  game.guessed.push(letter);
  if (!game.word.includes(letter)) game.tries--;

  const display = game.word.split('').map(l => game.guessed.includes(l) ? l : '_').join(' ');
  const won     = !display.includes('_');

  if (won) {
    delete hangmanStore[jid];
    return reply(sock, msg, `🎉 *You won!*\nWord: *${game.word}*`);
  }
  if (game.tries <= 0) {
    delete hangmanStore[jid];
    return reply(sock, msg, `😢 *Game over!*\nWord was: *${game.word}*`);
  }
  await reply(sock, msg, `🔠 Word: \`${display}\`\nGuessed: ${game.guessed.join(', ')}\nTries left: ${game.tries}`);
});

cmd('8ball', async ({ sock, msg, text }) => {
  if (!text) return reply(sock, msg, `Usage: ${PREFIX}8ball Will I pass today?`);
  const answers = [
    '✅ It is certain', '✅ Without a doubt', '✅ Yes, definitely',
    '✅ You may rely on it', '✅ Most likely', '🤔 Ask again later',
    '🤔 Cannot predict now', '🤔 Concentrate and ask again',
    '❌ Don\'t count on it', '❌ My sources say no', '❌ Very doubtful',
  ];
  const answer = answers[Math.floor(Math.random() * answers.length)];
  await reply(sock, msg, `🎱 *Magic 8-Ball*\n\n❓ ${text}\n\n${answer}`);
});

cmd('dice', async ({ sock, msg, text }) => {
  const match = (text || '1d6').match(/^(\d+)d(\d+)$/i);
  if (!match) return reply(sock, msg, `Usage: ${PREFIX}dice 2d6`);
  const [, count, sides] = match.map(Number);
  if (count > 20 || sides > 100) return reply(sock, msg, '❌ Max 20 dice, 100 sides');
  const rolls  = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
  const total  = rolls.reduce((a, b) => a + b, 0);
  await reply(sock, msg, `🎲 *Dice Roll (${count}d${sides})*\n\nRolls: ${rolls.join(', ')}\nTotal: *${total}*`);
});

cmd('flip', async ({ sock, msg }) => {
  const result = Math.random() < 0.5 ? '🪙 *HEADS*' : '🪙 *TAILS*';
  await reply(sock, msg, `🪙 *Coin Flip*\n\n${result}`);
});

cmd('lyrics', async ({ sock, msg, text }) => {
  if (!text) return reply(sock, msg, `Usage: ${PREFIX}lyrics Sauti Sol`);
  try {
    const res   = await axios.get(`https://some-random-api.com/lyrics?title=${encodeURIComponent(text)}`);
    const { title, author, lyrics } = res.data;
    const trimmed = lyrics?.length > 1000 ? lyrics.substring(0, 1000) + '...' : lyrics;
    await reply(sock, msg, `🎤 *${title}* — ${author}\n\n${trimmed}`);
  } catch (e) {
    await reply(sock, msg, `❌ Lyrics not found for: ${text}`);
  }
});

cmd('horoscope', async ({ sock, msg, text }) => {
  if (!text) return reply(sock, msg, `Usage: ${PREFIX}horoscope scorpio`);
  try {
    const res = await axios.get(`https://horoscope-app-api.vercel.app/api/v1/get-horoscope/daily?sign=${text}&day=TODAY`);
    const d   = res.data.data;
    await reply(sock, msg, `🌟 *${text.toUpperCase()} — Daily Horoscope*\n\n${d.horoscope_data}`);
  } catch (e) {
    await reply(sock, msg, `❌ Horoscope error for: ${text}`);
  }
});

// ══════════════════════════════════════════════════════════
//  ⚙️  BOT SETTINGS
// ══════════════════════════════════════════════════════════

cmd('menu', async ({ sock, msg }) => {
  await react(sock, msg, '⚡');
  await sendMenu(sock, msg.key.remoteJid, OWNER_NAME, PREFIX);
});

cmd('ping', async ({ sock, msg }) => {
  const start = Date.now();
  const sent  = await reply(sock, msg, '🏓 Pinging...');
  const ms    = Date.now() - start;
  await sock.sendMessage(msg.key.remoteJid, {
    text: `🏓 *Pong!*\n\n⚡ Speed: *${ms}ms*\n🔋 RAM: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)}MB\n⏱ Uptime: ${Math.floor(process.uptime())}s`,
  }, { edit: sent.key });
});

cmd('botinfo', async ({ sock, msg }) => {
  const uptime  = process.uptime();
  const h = Math.floor(uptime / 3600);
  const m = Math.floor((uptime % 3600) / 60);
  const ram = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
  await reply(sock, msg,
    `⚡ *${BOT_NAME} Info*\n\n` +
    `🤖 Bot: ${BOT_NAME}\n` +
    `👤 Owner: ${OWNER_NAME}\n` +
    `📌 Version: ${VERSION}\n` +
    `⏱ Uptime: ${h}h ${m}m\n` +
    `🔋 RAM: ${ram}MB\n` +
    `🟢 Status: Online\n` +
    `📦 Commands: 74+\n` +
    `🌍 Platform: ${detectPlatform()}\n` +
    `⚙️ Node: ${process.version}`
  );
});

cmd('profile', async ({ sock, msg, sender }) => {
  const num = sender.split('@')[0];
  await reply(sock, msg,
    `👤 *Your Profile*\n\n` +
    `📱 Number: +${num}\n` +
    `🌟 Status: Member\n` +
    `⚡ Bot: ${BOT_NAME}\n` +
    `📅 Date: ${new Date().toLocaleDateString('en-KE', { timeZone: 'Africa/Nairobi' })}`
  );
});

cmd('lang', async ({ sock, msg, args }) => {
  const lang = args[0];
  if (!lang) return reply(sock, msg, `Usage: ${PREFIX}lang sw\n\nAvailable: en (English), sw (Swahili)`);
  await reply(sock, msg, `🌍 Language preference set to: *${lang}*\n_Full multi-language support coming soon._`);
});

cmd('notify', async ({ sock, msg, args }) => {
  const state = args[0]?.toLowerCase();
  await reply(sock, msg, `🔔 Notifications *${state === 'off' ? 'disabled' : 'enabled'}*`);
});

cmd('stats', async ({ sock, msg }) => {
  await reply(sock, msg,
    `📊 *${BOT_NAME} Stats*\n\n` +
    `📦 Total Commands: 74\n` +
    `🟢 Bot Status: Online\n` +
    `⏱ Uptime: ${Math.floor(process.uptime() / 60)}m\n` +
    `🌍 Built by: ADEZ Tech · Nairobi`
  );
});

cmd('update', async ({ sock, msg }) => {
  if (!isOwner(getSender(msg))) return reply(sock, msg, '❌ Owner only command');
  await reply(sock, msg, '🔄 Checking for updates...\n\n_Restart the bot to trigger the auto-update system (index.js)_');
});

cmd('restart', async ({ sock, msg }) => {
  if (!isOwner(getSender(msg))) return reply(sock, msg, '❌ Owner only command');
  await reply(sock, msg, '🔄 Restarting XMD-TECH...');
  setTimeout(() => process.exit(0), 2000);
});

cmd('help', async ({ sock, msg, args }) => {
  const cmdName = args[0]?.toLowerCase();
  if (!cmdName) return reply(sock, msg, `Usage: ${PREFIX}help <command>\nExample: ${PREFIX}help ytmp4`);
  if (commands[cmdName]) {
    await reply(sock, msg, `ℹ️ *${PREFIX}${cmdName}*\n\nCommand exists and is active.\nType it with the required arguments.`);
  } else {
    await reply(sock, msg, `❌ Command not found: *${PREFIX}${cmdName}*\n\nType ${PREFIX}menu to see all commands.`);
  }
});

// ─── PLATFORM DETECT ─────────────────────────────────────────────────────────

function detectPlatform() {
  if (process.env.RAILWAY_ENVIRONMENT) return 'Railway';
  if (process.env.DYNO)               return 'Heroku';
  if (process.env.RENDER)             return 'Render';
  return require('os').platform() === 'win32' ? 'Windows' : 'Linux';
}

// ─── CONNECTION ──────────────────────────────────────────────────────────────

async function startBot() {
  if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  const { version }           = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth:          state,
    logger:        pino({ level: 'silent' }),
    printQRInTerminal: true,
    browser:       ['XMD-TECH', 'Chrome', '120.0.0'],
    markOnlineOnConnect: true,
  });

  store.bind(sock.ev);

  // ── CREDS ────────────────────────────────────────────────────────────────
  sock.ev.on('creds.update', saveCreds);

  // ── CONNECTION UPDATE ─────────────────────────────────────────────────────
  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) log('Scan the QR code above to connect.', 'warn');

    if (connection === 'open') {
      log(`Connected as ${sock.user?.name || sock.user?.id}`, 'success');
      // Notify owner
      try {
        await sock.sendMessage(OWNER_JID, {
          text: `⚡ *${BOT_NAME} is now online!*\n\n✅ Connected successfully\n📦 ${Object.keys(commands).length} commands loaded\n🌍 Platform: ${detectPlatform()}\n📌 Version: ${VERSION}`,
        });
      } catch (_) {}
    }

    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
      log(`Connection closed. Reason: ${reason}`, 'warn');

      if (reason === DisconnectReason.loggedOut) {
        log('Logged out — clearing session.', 'error');
        process.exit(10); // Triggers session wipe in index.js
      } else {
        log('Reconnecting...', 'warn');
        setTimeout(startBot, 5000);
      }
    }
  });

  // ── GROUP EVENTS ─────────────────────────────────────────────────────────
  sock.ev.on('group-participants.update', async ({ id, participants, action }) => {
    if (action === 'add' && welcomeGroups.has(id)) {
      for (const p of participants) {
        await sock.sendMessage(id, {
          text:     `👋 Welcome to the group, @${p.split('@')[0]}! 🎉\n\nType *${PREFIX}menu* to see what I can do.`,
          mentions: [p],
        });
      }
    }
    if (action === 'remove' && goodbyeGroups.has(id)) {
      for (const p of participants) {
        await sock.sendMessage(id, {
          text: `🚪 @${p.split('@')[0]} has left the group. Goodbye! 👋`,
          mentions: [p],
        });
      }
    }
  });

  // ── MESSAGES ─────────────────────────────────────────────────────────────
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      try {
        if (!msg.message) continue;
        if (msg.key.fromMe) continue;

        const jid        = msg.key.remoteJid;
        const sender     = getSender(msg);
        const body       = getBody(msg);
        const isGroupMsg = isGroup(jid);

        // ── Anti-link ────────────────────────────────────────────────────
        if (isGroupMsg && antiLinkGroups.has(jid)) {
          const linkRegex = /(https?:\/\/|www\.|chat\.whatsapp\.com)[^\s]+/i;
          if (linkRegex.test(body)) {
            const meta   = await sock.groupMetadata(jid);
            const admins = meta.participants.filter(p => p.admin).map(p => p.id);
            if (!admins.includes(sender)) {
              await sock.sendMessage(jid, { delete: msg.key });
              await sock.sendMessage(jid, {
                text:     `🚫 @${sender.split('@')[0]} — Links are not allowed in this group!`,
                mentions: [sender],
              });
              continue;
            }
          }
        }

        // ── Anti-spam ─────────────────────────────────────────────────────
        if (isGroupMsg && antiSpamGroups.has(jid)) {
          const key  = `${jid}_${sender}`;
          const now  = Date.now();
          if (!spamTracker[key]) spamTracker[key] = { count: 0, time: now };
          if (now - spamTracker[key].time < 5000) {
            spamTracker[key].count++;
            if (spamTracker[key].count > 5) {
              const count = addWarn(jid, sender);
              await sock.sendMessage(jid, {
                text:     `🚫 @${sender.split('@')[0]} — Stop spamming! Warning ${count}/3`,
                mentions: [sender],
              });
              if (count >= 3) {
                await sock.groupParticipantsUpdate(jid, [sender], 'remove');
                clearWarn(jid, sender);
              }
              spamTracker[key].count = 0;
            }
          } else {
            spamTracker[key] = { count: 1, time: now };
          }
        }

        // ── Trivia answer check ───────────────────────────────────────────
        if (triviaStore[jid]) {
          const game = triviaStore[jid];
          if (Date.now() < game.expires && body?.toUpperCase() === game.answer) {
            delete triviaStore[jid];
            await reply(sock, msg, `🎉 *Correct!* The answer was *${game.answer}*`);
            continue;
          }
        }

        // ── Command handling ──────────────────────────────────────────────
        if (!body.startsWith(PREFIX)) continue;

        const parts   = body.slice(PREFIX.length).trim().split(/\s+/);
        const command = parts[0].toLowerCase();
        const args    = parts.slice(1);
        const text    = args.join(' ');

        log(`CMD: ${PREFIX}${command} | FROM: ${sender.split('@')[0]} | JID: ${jid}`);

        const handler = commands[command];
        if (!handler) {
          await reply(sock, msg, `❌ Unknown command: *${PREFIX}${command}*\n\nType *${PREFIX}menu* to see all commands.`);
          continue;
        }

        await handler({ sock, msg, args, text, jid, sender, isGroupMsg, isOwner: isOwner(sender) });

      } catch (err) {
        log(`Message handler error: ${err.message}`, 'error');
        try {
          await reply(sock, messages[0], `❌ Error: ${err.message}`);
        } catch (_) {}
      }
    }
  });

  return sock;
}

// ─── BOOT ────────────────────────────────────────────────────────────────────

log(`Starting ${BOT_NAME} v${VERSION}...`);
startBot().catch(err => {
  log(`Fatal error: ${err.message}`, 'error');
  process.exit(1);
});
