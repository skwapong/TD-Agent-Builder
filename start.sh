#!/bin/bash

# Agent Builder Wizard (TD LLM Edition) - Start Script
# This starts the TD LLM proxy and opens the wizard

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║       🚀 Agent Builder Wizard - TD LLM Edition                 ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found!"
    echo ""
    if [ -f .env.example ]; then
        echo "📝 Creating .env from .env.example..."
        cp .env.example .env
        echo "✅ Created .env file"
        echo ""
        echo "⚠️  Please edit .env and add your Treasure Data API key:"
        echo "   TD_API_KEY=your-api-key-here"
        echo ""
        read -p "Press Enter to continue after editing .env, or Ctrl+C to exit..."
    else
        echo "❌ No .env.example found. Please create a .env file."
        exit 1
    fi
fi

# Check if TD_API_KEY is configured
if grep -q "TD_API_KEY=your-td-api-key-here" .env 2>/dev/null; then
    echo "⚠️  TD_API_KEY is not configured in .env!"
    echo ""
    echo "Please edit .env and add your Treasure Data API key."
    echo ""
    read -p "Press Enter to continue anyway, or Ctrl+C to exit..."
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found!"
    echo ""
    echo "Please install Node.js from: https://nodejs.org/"
    echo ""
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check if port 3001 is already in use
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Port 3001 is already in use"
    echo ""
    read -p "Kill existing process? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        lsof -ti :3001 | xargs kill -9 2>/dev/null
        echo "✅ Killed existing process"
        sleep 1
    else
        echo "❌ Cannot start - port in use"
        exit 1
    fi
fi

# Start the proxy server
echo ""
echo "🔄 Starting TD LLM proxy server..."
node proxy-server.js &
PROXY_PID=$!

# Wait for proxy to start
sleep 2

# Check if proxy started successfully
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo ""
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                                                                ║"
    echo "║  ✅ Agent Builder Wizard is ready!                            ║"
    echo "║                                                                ║"
    echo "║  🌐 Open in browser: http://localhost:3001                    ║"
    echo "║                                                                ║"
    echo "║  The proxy is running in the background.                      ║"
    echo "║                                                                ║"
    echo "║  To stop the proxy:                                           ║"
    echo "║    kill $PROXY_PID                                             ║"
    echo "║                                                                ║"
    echo "║  Or run:                                                      ║"
    echo "║    lsof -ti :3001 | xargs kill -9                             ║"
    echo "║                                                                ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""

    # Try to open browser
    if command -v open &> /dev/null; then
        echo "📂 Opening wizard in browser..."
        open "http://localhost:3001"
    elif command -v xdg-open &> /dev/null; then
        echo "📂 Opening wizard in browser..."
        xdg-open "http://localhost:3001"
    else
        echo "📂 Please open http://localhost:3001 in your browser"
    fi

    echo ""
    echo "Proxy PID: $PROXY_PID"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""

    # Follow the proxy logs
    wait $PROXY_PID
else
    echo "❌ Failed to start proxy server"
    kill $PROXY_PID 2>/dev/null
    exit 1
fi
