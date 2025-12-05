# Agent Builder Wizard - TD LLM Edition

> **AI-Powered Agent Builder using Treasure Data LLM API**

Build custom AI agents with an intuitive wizard interface, powered by Treasure Data's LLM API.

---

## ⚡ Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/skwapong/agent-builder-wizard-tdllm.git
cd agent-builder-wizard-tdllm

# 2. Configure your API key
cp .env.example .env
# Edit .env and add your TD_API_KEY

# 3. Start the wizard
./start.sh

# Or manually:
node proxy-server.js
# Open http://localhost:3001
```

**See [QUICK_START.md](QUICK_START.md) for detailed setup instructions.**

---

## 🎯 Features

- 🤖 **AI-Powered Generation** - Describe your agent and let AI build it
- 📚 **Knowledge Base Creation** - Auto-generate knowledge bases from descriptions
- 💬 **Streaming Responses** - Real-time AI responses with streaming
- 📋 **Pre-built Templates** - Start from marketing, HR, support templates
- 📥 **Export Options** - Download as markdown, JSON, or ZIP
- 🌐 **Multi-language** - English and Japanese support

---

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Browser UI    │────▶│  Proxy Server   │────▶│   TD LLM API    │
│  (index.html)   │     │  (localhost:    │     │  (treasuredata  │
│                 │◀────│     3001)       │◀────│      .com)      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

| Component | Description |
|-----------|-------------|
| **Browser UI** | Wizard interface (HTML/JS/CSS) |
| **Proxy Server** | Node.js server handling auth & API proxy |
| **TD LLM API** | Treasure Data's LLM service |

---

## 📁 Project Structure

```
agent-builder-wizard-tdllm/
├── index.html           # Main wizard UI
├── td-llm-api.js        # TD LLM API client
├── wizard-ai.js         # Wizard logic & AI integration
├── proxy-server.js      # Node.js proxy server
├── agent-templates.js   # Pre-built agent templates
├── config-helper.js     # Configuration utilities
├── td-theme.css         # Treasure Data styling
├── favicon.ico          # TD icon
├── start.sh             # Quick start script
├── .env.example         # Environment template
├── .gitignore           # Git ignore rules
├── package.json         # Node.js config
├── vercel.json          # Vercel deployment config
├── QUICK_START.md       # Quick start guide
└── README.md            # This file
```

---

## ⚙️ Configuration

### Environment Variables (.env)

| Variable | Description | Required |
|----------|-------------|----------|
| `TD_API_KEY` | Your Treasure Data API key | ✅ Yes |
| `TD_LLM_BASE_URL` | TD LLM API URL | No (has default) |
| `TD_AGENT_ID` | Default agent ID | No |
| `PORT` | Server port | No (default: 3001) |

### Getting Your TD API Key

1. Log into [Treasure Data Console](https://console.treasuredata.com)
2. Go to **Settings** → **API Keys**
3. Copy your Master API Key
4. Add to `.env` file

---

## 🚀 Deployment

### Local Development
```bash
./start.sh
# or
node proxy-server.js
```

### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Set secrets
vercel secrets add td-api-key "your-api-key"
vercel secrets add td-llm-base-url "https://llm-api-development.us01.treasuredata.com"
vercel secrets add td-agent-id "your-agent-id"

# Deploy
vercel
```

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| 🔴 Red connection indicator | Check `.env` has valid `TD_API_KEY` |
| "Proxy not available" | Run `./start.sh` or `node proxy-server.js` |
| Port 3001 in use | `lsof -ti :3001 \| xargs kill -9` |
| Permission denied | `chmod +x start.sh` |
| Chat session fails | Verify `TD_AGENT_ID` is set |

### Debug Mode

Check proxy server logs for:
- `📤` - Outgoing requests
- `📥` - Responses received
- `❌` - Errors

---

## 📊 Comparison with Original

| Feature | PM-Agent-Squad-Master | This Version (TD LLM) |
|---------|----------------------|----------------------|
| Backend | Local CLI | TD LLM API |
| Auth | Local Auth | TD API Key |
| Deployment | Local Only | Deploy Anywhere |
| Models | Limited | Multiple via TD |
| Portability | Local only | Deploy anywhere |

---

## 📜 License

MIT

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

**Built with ❤️ using Treasure Data LLM API**
