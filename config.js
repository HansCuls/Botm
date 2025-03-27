module.exports = {
    BOT: {
        TOKEN: "YOUR_BOT_TOKEN", // Token bot dari BotFather
        PREFIX: "/", // Prefix untuk perintah bot
        OWNER_ID: 123456789, // ID Telegram Owner Bot
    },

    TELEGRAM: {
        API_ID: 123456, // API ID dari my.telegram.org
        API_HASH: "your_api_hash", // API Hash dari my.telegram.org
        SESSION_STRING: "your_session_string", // Session string dari GramJS
    },

    MUSIC: {
        DEFAULT_VOLUME: 50, // Volume default (0-100)
        MAX_DURATION: 600, // Durasi maksimal lagu dalam detik (10 menit)
        YT_DLP_PATH: "yt-dlp", // Path ke yt-dlp (pastikan terinstal)
        FFMPEG_PATH: "ffmpeg", // Path ke FFmpeg (pastikan terinstal)
    },

    LINKS: {
        CHANNEL: "https://t.me/YOUR_CHANNEL", // Link channel bot
        SUPPORT_GROUP: "https://t.me/YOUR_SUPPORT_GROUP", // Link grup support
    }
};