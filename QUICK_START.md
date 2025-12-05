# Quick Start Guide - TD Agent Builder

> **For colleagues who just want to start building agents NOW!**

---

## ⚡ 5-Minute Setup

### 1. Clone & Setup (First Time Only)
```bash
# Clone the repository
git clone https://github.com/skwapong/TD-Agent-Builder.git
cd TD-Agent-Builder

# Create your config file
cp .env.example .env

# Edit .env and add your TD API key
nano .env   # or use any text editor
```

### 2. Configure Your API Key
Edit the `.env` file and set:
```
TD_API_KEY=your-treasure-data-api-key
TD_AGENT_ID=your-agent-id  # Optional
```

### 3. Start Every Time
```bash
cd /path/to/TD-Agent-Builder
./start.sh
```

**Or manually:**
```bash
node proxy-server.js
# Then open http://localhost:3001
```

---

## 🔄 Update to Latest Version

```bash
cd /path/to/TD-Agent-Builder
git pull origin main
./start.sh
```

---

## 🎯 Usage

1. **Check for 🟢 green indicator** (top-right "API Settings")
2. **Describe your agent** in the text box
3. **Click "✨ Auto-Generate Agent"**
4. **Download your files** and deploy to Treasure Data

---

## 🆘 Common Issues

| Problem | Solution |
|---------|----------|
| 🔴 Red indicator | Check .env has valid TD_API_KEY |
| Connection failed | Make sure `node proxy-server.js` is running |
| Permission denied | Run `chmod +x start.sh` |
| Port 3001 in use | Run `lsof -ti :3001 \| xargs kill -9` |

---

## 📞 Need Help?

- **Full Guide:** See `README.md`
- **Issues:** https://github.com/skwapong/agent-builder-wizard-tdllm/issues

---

## 🔑 Getting Your TD API Key

1. Log into Treasure Data Console
2. Go to **Settings** → **API Keys**
3. Copy your Master API Key
4. Paste it into your `.env` file

---

**Pro Tip:** Always run `git pull` before starting to get the latest version! 🚀
