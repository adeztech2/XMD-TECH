<h1 align="center">
  <img src="https://readme-typing-svg.herokuapp.com?font=Orbitron&size=40&duration=3000&pause=1000&color=00E5FF&center=true&vCenter=true&width=700&lines=⚡+XMD-TECH+BOT;WhatsApp+Automation+System;Built+by+ADEZ+Tech;Nairobi%2C+Kenya+🇰🇪"/>
</h1>

<p align="center">
  <img src="https://img.shields.io/badge/Version-2.0.0-00e5ff?style=for-the-badge&logo=github"/>
  <img src="https://img.shields.io/badge/Platform-WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white"/>
  <img src="https://img.shields.io/badge/Runtime-Node.js%2020+-339933?style=for-the-badge&logo=node.js&logoColor=white"/>
  <img src="https://img.shields.io/badge/License-MIT-7b2fff?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Made%20in-Kenya%20🇰🇪-black?style=for-the-badge"/>
</p>

<p align="center">
  <b>XMD-TECH</b> is a powerful, AI-enhanced WhatsApp automation bot with 74+ commands across 7 categories — built on Baileys/Node.js and deployed on Railway. Crafted by <a href="https://adeztech.co.ke">ADEZ Tech</a> · Nairobi, Kenya.
</p>

---

## 📸 Preview

```
╔══════════════════════════════╗
║  ⚡  *X M D - T E C H*  ⚡  ║
║   WhatsApp Automation Bot    ║
╚══════════════════════════════╝

👤 Owner:   Arnold
🕐 Time:    11:41 AM EAT
📅 Date:    Tuesday, 16 June
⚡ Ping:    12ms
🔋 RAM:     42MB / 512MB
⏱ Uptime:  3h 24m
🌐 Platform: Railway

┌─「 🤖  A I  &  I N T E L L I G E N C E 」
│ .ai            Chat with Claude AI
│ .gpt           GPT-4 powered answers
│ .imagine       Generate AI images
│ .translate     Translate any text
└────────────────────────────
```

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **AI Powered** | Claude AI + GPT-4 integration for smart responses |
| 📥 **Media Downloader** | YouTube, TikTok, Instagram, Spotify, Twitter & more |
| 👑 **Group Management** | Anti-link, anti-spam, kick, promote, tagall & more |
| 🛠️ **Utility Tools** | M-Pesa, KPLC, forex, weather, QR codes & more |
| 🎮 **Fun & Games** | Trivia, jokes, riddles, hangman, 8ball & more |
| 🎨 **Media Conversion** | Stickers, TTS, GIFs, transcription & more |
| ⚡ **Auto-Update** | Self-updating engine with 3-server fallback |
| 🔒 **Session Backup** | Auto session restore on restart |
| 🌍 **Africa-Ready** | Built for Kenya — M-Pesa, KPLC, EAT timezone |

---

## 🚀 Deploy Options

<p align="center">
  <a href="https://railway.app/new">
    <img src="https://img.shields.io/badge/Deploy%20on-Railway-000000?style=for-the-badge&logo=railway"/>
  </a>
  &nbsp;
  <a href="https://dashboard.heroku.com/new">
    <img src="https://img.shields.io/badge/Deploy%20on-Heroku-6762A6?style=for-the-badge&logo=heroku"/>
  </a>
  &nbsp;
  <a href="https://render.com">
    <img src="https://img.shields.io/badge/Deploy%20on-Render-0099ff?style=for-the-badge&logo=render"/>
  </a>
</p>

---

## ⚙️ Setup Guide

### 1. Fork or Clone this repo
```bash
git clone https://github.com/adez-tech/XMD-TECH-.git
cd XMD-TECH-
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
```
Edit `.env` and fill in your values (see [Environment Variables](#-environment-variables) below).

### 4. Get your SESSION_ID
Visit one of these pairing servers and link your WhatsApp number:

<p align="center">
  <a href="https://pair.cypherxbot.space/">
    <img src="https://img.shields.io/badge/PAIR%20SERVER%201-ff0050?style=for-the-badge&logo=whatsapp&logoColor=white"/>
  </a>
  &nbsp;
  <a href="https://pair2.cypherxbot.space/">
    <img src="https://img.shields.io/badge/PAIR%20SERVER%202-ff6a00?style=for-the-badge&logo=whatsapp&logoColor=white"/>
  </a>
</p>

### 5. Start the bot
```bash
npm start
```

---

## 🔑 Environment Variables

Create a `.env` file in the root directory:

```env
# WhatsApp Session (required)
SESSION_ID=your_session_id_here

# Bot Owner
OWNER_NAME=Arnold
OWNER_NUMBER=254700000000
BOT_NAME=XMD-TECH
PREFIX=.

# AI Keys (optional)
ANTHROPIC_API_KEY=your_claude_api_key
GEMINI_API_KEY=your_gemini_api_key

# Update Servers (optional)
UPDATE_SERVER_1=https://updates.adeztech.co.ke
FALLBACK_ZIP_URL=

# Port
PORT=3000
```

---

## 📋 Command Categories

<details>
<summary>🤖 AI & Intelligence (9 commands)</summary>

| Command | Description |
|---|---|
| `.ai` | Chat with Claude AI |
| `.gpt` | GPT-4 powered answers |
| `.imagine` | Generate AI images |
| `.translate` | Translate any text |
| `.summarize` | Summarize text or URLs |
| `.analyze` | AI image analysis |
| `.search` | Web search + AI summary |
| `.ideas` | Generate creative ideas |
| `.jarvis` | Full AI assistant |

</details>

<details>
<summary>📥 Media Downloader (10 commands)</summary>

| Command | Description |
|---|---|
| `.ytmp4` | YouTube video (MP4) |
| `.ytmp3` | YouTube audio (MP3) |
| `.ig` | Instagram photos/reels |
| `.tiktok` | TikTok no-watermark |
| `.twitter` | Twitter/X videos |
| `.spotify` | Spotify tracks |
| `.fb` | Facebook videos |
| `.pin` | Pinterest media |
| `.song` | Search & download songs |
| `.sticker` | Image/video → sticker |

</details>

<details>
<summary>👑 Group Management (15 commands)</summary>

| Command | Description |
|---|---|
| `.kick` | Remove a member |
| `.promote` | Make member admin |
| `.demote` | Remove admin rights |
| `.mute` | Mute the group |
| `.unmute` | Unmute the group |
| `.antilink` | Block links on/off |
| `.antispam` | Auto-kick spammers |
| `.welcome` | Welcome message on/off |
| `.goodbye` | Goodbye message on/off |
| `.tagall` | Tag all members |
| `.groupinfo` | Show group details |
| `.revoke` | Reset invite link |
| `.setname` | Change group name |
| `.setdp` | Set group picture |
| `.warn` | Warn member (3 = kick) |

</details>

<details>
<summary>🛠️ Utility Tools (12 commands)</summary>

| Command | Description |
|---|---|
| `.forex` | Live currency exchange |
| `.weather` | Weather forecast |
| `.mpesa` | M-Pesa tariff checker |
| `.kplc` | KPLC token status |
| `.calc` | Calculator |
| `.remind` | Set a reminder |
| `.news` | Latest Kenya news |
| `.track` | Track parcels |
| `.password` | Generate strong password |
| `.qr` | Generate QR code |
| `.shorturl` | Shorten URLs |
| `.ip` | IP address lookup |

</details>

<details>
<summary>🎨 Media & Conversion (8 commands)</summary>

| Command | Description |
|---|---|
| `.toimg` | Sticker → image |
| `.togif` | Video → GIF |
| `.tts` | Text → voice note |
| `.transcribe` | Voice note → text |
| `.rotate` | Rotate image |
| `.caption` | Add text to image |
| `.emojimix` | Combine two emojis |
| `.resize` | Resize image |

</details>

<details>
<summary>🎮 Fun & Games (10 commands)</summary>

| Command | Description |
|---|---|
| `.joke` | Random joke |
| `.quote` | Motivational quote |
| `.trivia` | Quick trivia game |
| `.riddle` | Brain teaser |
| `.hangman` | Hangman game |
| `.8ball` | Magic 8-ball |
| `.dice` | Roll dice |
| `.flip` | Flip a coin |
| `.lyrics` | Get song lyrics |
| `.horoscope` | Daily horoscope |

</details>

<details>
<summary>⚙️ Bot Settings (10 commands)</summary>

| Command | Description |
|---|---|
| `.menu` | Show command menu |
| `.ping` | Check bot speed |
| `.botinfo` | Bot version & stats |
| `.profile` | Your usage stats |
| `.lang` | Change language |
| `.notify` | Toggle notifications |
| `.stats` | Global bot stats |
| `.update` | Check for update |
| `.restart` | Restart bot (owner) |
| `.help` | Help for any command |

</details>

---

## 🗂️ Project Structure

```
XMD-TECH/
├── index.js          # Auto-update launcher engine
├── menu.js           # WhatsApp menu system
├── xmd.js            # Bot core (downloaded at runtime)
├── package.json      # Dependencies
├── Procfile          # Railway/Heroku start command
├── .env.example      # Environment variables template
├── src/
│   ├── Session/      # WhatsApp session files
│   ├── Database/     # SQLite/Postgres database
│   └── plugins/      # Command handlers
└── tmp/              # Logs
```

---

## 🔄 Auto-Update System

XMD-TECH includes a **self-updating engine** inspired by CypherX:

- Checks 3 update servers on every startup
- Falls back to a direct ZIP URL if servers are unreachable
- Preserves your session, database, and `.env` during updates
- Auto-restarts on crash with up to 3 retries
- Detects platform (Railway, Heroku, Render, Termux, Panel)

---

## 👨‍💻 Developer

<p align="center">
  <img src="https://github.com/arnoldadez.png" width="100" style="border-radius:50%"/>
  <br/>
  <b>Arnold · ADEZ Tech</b>
  <br/>
  Nairobi, Kenya 🇰🇪
</p>

<p align="center">
  <a href="https://adeztech.co.ke">
    <img src="https://img.shields.io/badge/Website-adeztech.co.ke-00e5ff?style=for-the-badge&logo=google-chrome&logoColor=white"/>
  </a>
  &nbsp;
  <a href="https://github.com/arnoldadez">
    <img src="https://img.shields.io/badge/GitHub-arnoldadez-181717?style=for-the-badge&logo=github"/>
  </a>
</p>

---

## ⭐ Support

If you find XMD-TECH useful, please **star this repository** — it helps the project grow!

<p align="center">
  <a href="https://github.com/adez-tech/XMD-TECH-/stargazers">
    <img src="https://img.shields.io/github/stars/adez-tech/XMD-TECH-?style=for-the-badge&color=yellow&logo=github"/>
  </a>
</p>

---

<p align="center">
  <sub>⚡ Built with Node.js · Baileys · Claude AI · Deployed on Railway</sub><br/>
  <sub>© 2025 ADEZ Tech · Nairobi, Kenya</sub>
</p>
