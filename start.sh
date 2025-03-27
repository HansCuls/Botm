#!/bin/bash

echo "🔄 Memeriksa & menginstal dependensi yang diperlukan..."

# Update & install yt-dlp jika belum ada
if ! command -v yt-dlp &> /dev/null
then
    echo "📥 Menginstal yt-dlp..."
    sudo apt update && sudo apt install yt-dlp -y
fi

# Install dependencies dari package.json
echo "📦 Menginstal dependencies Node.js..."
npm install

# Menjalankan bot
echo "🚀 Menjalankan bot..."
node bot.js