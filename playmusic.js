const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const ytdl = require("@distube/ytdl-core");
const betabotz = require("betabotz-tools");
const axios = require("axios");

const CACHE_FOLDER = path.join(__dirname, "cache");

// Buat folder cache jika belum ada
if (!fs.existsSync(CACHE_FOLDER)) {
    fs.mkdirSync(CACHE_FOLDER, { recursive: true });
}

const queue = new Map();

// Fungsi untuk mencari video YouTube
async function searchYouTube(query) {
    try {
        console.log(`🔍 Mencari lagu di YouTube: ${query}`);
        const response = await axios.get(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`);
        const videoIdMatch = response.data.match(/"videoId":"(.*?)"/);
        if (videoIdMatch) {
            return `https://www.youtube.com/watch?v=${videoIdMatch[1]}`;
        }
        return null;
    } catch (error) {
        console.error("❌ Gagal mencari lagu di YouTube:", error);
        return null;
    }
}

// Fungsi validasi URL
function isValidURL(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

// Fungsi untuk mengunduh lagu
async function downloadMedia(input, chatId, bot) {
    try {
        let url = input;
        if (!isValidURL(input)) {
            bot.sendMessage(chatId, `🔍 Mencari lagu: *${input}*...`);
            url = await searchYouTube(input);
            if (!url) {
                bot.sendMessage(chatId, "❌ Tidak dapat menemukan lagu tersebut.");
                throw new Error("Lagu tidak ditemukan");
            }
        }

        const title = url.split("v=")[1]; 
        const filePath = path.join(CACHE_FOLDER, `${title}.mp3`);

        if (fs.existsSync(filePath)) {
            console.log(`✅ Menggunakan file cache: ${filePath}`);
            return filePath;
        }

        bot.sendMessage(chatId, `📥 Mengunduh lagu...`);
        console.log(`⬇️ Mengunduh: ${url}`);

        return new Promise((resolve, reject) => {
            exec(`yt-dlp -x --audio-format mp3 -o "${filePath}" "${url}"`, async (error) => {
                if (!error) {
                    console.log(`✅ Download selesai: ${filePath}`);
                    return resolve(filePath);
                }

                console.error(`❌ yt-dlp gagal, mencoba ytdl-core...`);

                try {
                    const stream = await ytdl(url, { filter: "audioonly" });
                    const writeStream = fs.createWriteStream(filePath);
                    stream.pipe(writeStream);
                    writeStream.on("finish", () => {
                        console.log(`✅ Download selesai: ${filePath}`);
                        resolve(filePath);
                    });
                } catch (err) {
                    console.error(`❌ Semua metode gagal!`);
                    bot.sendMessage(chatId, "❌ Tidak bisa mengunduh lagu ini. Silakan coba lagu lain.");
                    reject(err);
                }
            });
        });

    } catch (error) {
        console.error("❌ Gagal mengunduh media:", error);
        throw error;
    }
}

// Fungsi untuk memainkan musik
async function playMusic(chatId, bot) {
    if (!queue.has(chatId) || queue.get(chatId).length === 0) {
        bot.sendMessage(chatId, "✅ Antrian kosong, musik dihentikan.");
        return;
    }

    let song = queue.get(chatId).shift();
    const filePath = await downloadMedia(song.query, chatId, bot);
    console.log(`🎵 Memutar lagu dari: ${filePath}`);

    queue.set(chatId, { filePath, isPaused: false });

    const message = `
🎵 <b>Started Streaming</b>
▶️ <b>Title :</b> <a href="${song.query}">${song.query}</a>
📌 <b>Requested by :</b> <code>${chatId}</code>
`;

    const buttons = {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "⏪", callback_data: `previous_${chatId}` },
                    { text: "⏸", callback_data: `pause_${chatId}` },
                    { text: "🔄", callback_data: `resume_${chatId}` },
                    { text: "⏩", callback_data: `next_${chatId}` }
                ],
                [{ text: "❌ CLOSE", callback_data: `close_${chatId}` }]
            ]
        },
        parse_mode: "HTML"
    };

    const thumbnailUrl = `https://img.youtube.com/vi/${song.query.split("v=")[1]}/0.jpg`;

    bot.sendPhoto(chatId, thumbnailUrl, {
        caption: message,
        parse_mode: "HTML",
        reply_markup: buttons.reply_markup
    });

    // Hapus file setelah lagu selesai diputar
    setTimeout(() => {
        if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
                if (err) console.error("❌ Gagal menghapus file:", err);
            });
        }
        playMusic(chatId, bot); // Mainkan lagu berikutnya dalam antrian
    }, song.duration * 1000);
}

// Fungsi untuk menangani perintah /play
async function handlePlayCommand(ctx, bot) {
    let chatId = ctx.chat.id;
    let query = ctx.message.text.split(" ").slice(1).join(" ");

    if (!query) return ctx.reply("❌ Masukkan judul lagu!");

    let song = { query, duration: 180 }; // Default durasi 3 menit

    if (!queue.has(chatId)) queue.set(chatId, []);
    queue.get(chatId).push(song);

    ctx.reply(`✅ Lagu ditambahkan ke antrian: *${query}*`);

    if (queue.get(chatId).length === 1) {
        playMusic(chatId, bot);
    }
}

// Fungsi Pause
async function pauseMusic(chatId, bot) {
    const song = queue.get(chatId);
    if (!song) return bot.sendMessage(chatId, "❌ Tidak ada lagu yang sedang diputar.");
    if (song.isPaused) return bot.sendMessage(chatId, "⏸️ Musik sudah dalam keadaan pause.");

    song.isPaused = true;
    queue.set(chatId, song);
    bot.sendMessage(chatId, "⏸️ Musik dijeda.");
}

// Fungsi Resume
async function resumeMusic(chatId, bot) {
    const song = queue.get(chatId);
    if (!song) return bot.sendMessage(chatId, "❌ Tidak ada lagu yang sedang diputar.");
    if (!song.isPaused) return bot.sendMessage(chatId, "▶️ Musik sudah berjalan.");

    song.isPaused = false;
    queue.set(chatId, song);
    bot.sendMessage(chatId, "▶️ Musik dilanjutkan.");
}

// Fungsi Skip
async function skipMusic(chatId, bot) {
    if (!queue.has(chatId) || queue.get(chatId).length === 0) {
        return bot.sendMessage(chatId, "❌ Tidak ada lagu dalam antrian.");
    }
    
    bot.sendMessage(chatId, "⏭️ Lagu dilewati.");
    playMusic(chatId, bot);
}

module.exports = { handlePlayCommand, playMusic, pauseMusic, resumeMusic, skipMusic };