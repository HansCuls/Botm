const { Telegraf, Markup } = require("telegraf");
const config = require("./config"); // Import config.js
const { client, startGramClient } = require("./gramClient");
const { cleanCache } = require("./cacheCleaner");
const { handlePlayCommand, playMusic, pauseMusic, resumeMusic, skipMusic } = require("./playmusic");
const { startVCG } = require("./vcg");

const bot = new Telegraf(config.BOT.TOKEN);

// Jalankan GramJS Client
startGramClient().catch(console.error);
scheduleCleaner().catch(console.error);
// Handler untuk /start
bot.start(async (ctx) => {
    if (ctx.chat.type === "private") {
        // Kirim gambar sebelum menampilkan tombol
        await ctx.replyWithPhoto(
            { url: "https://example.com/path/to/your/image.jpg" }, // Ganti dengan URL gambar Anda
            {
                caption: "🎵 <b>Selamat datang di Bot Musik!</b>\nPilih salah satu tombol di bawah:",
                parse_mode: "HTML"
            }
        );

        // Kirim menu tombol setelah gambar
        await ctx.reply(
            "<b>Pilih salah satu tombol di bawah:</b>",
            {
                parse_mode: "HTML",
                reply_markup: Markup.inlineKeyboard([
    [Markup.button.url("➕ Tambahkan ke grup", `https://t.me/${ctx.botInfo.username}?startgroup=true`)],
    [
        Markup.button.url("👑 Owner", `tg://user?id=${config.BOT.OWNER_ID}`),
        Markup.button.url("📢 Channel", config.LINKS.CHANNEL)
    ],
    [Markup.button.callback("❓ Help Command", "help")]
])
            }
        );
    } else {
        // Jika di grup, hanya tampilkan menu tanpa gambar
        ctx.reply(
            "✅ <b>Bot aktif di grup ini!</b>\nGunakan tombol di bawah untuk mulai menggunakan bot.",
            {
                parse_mode: "HTML",
                reply_markup: Markup.inlineKeyboard([
    [Markup.button.url("➕ Tambahkan ke grup", `https://t.me/${ctx.botInfo.username}?startgroup=true`)],
    [
        Markup.button.url("👑 Owner", `tg://user?id=${config.BOT.OWNER_ID}`),
        Markup.button.url("📢 Channel", config.LINKS.CHANNEL)
    ],
    [Markup.button.callback("❓ Help Command", "help")]
])
            }
        );
    }
});

// Handler untuk tombol Help
bot.action("help", async (ctx) => {
    try {
        await ctx.editMessageText("🔹 <b>Pilih kategori bantuan:</b>", {
            parse_mode: "Markdown",
            reply_markup: Markup.inlineKeyboard([
                [Markup.button.callback("🎵 Perintah Musik", "help_music")],
                [Markup.button.callback("📌 Perintah Umum", "help_general")],
                [Markup.button.callback("⬅ Kembali", "back_to_start")]
            ])
        });
    } catch (error) {
        console.error("❌ Error saat menampilkan help:", error);
    }
});

// Handler untuk Perintah Musik
bot.action("help_music", async (ctx) => {
    try {
        await ctx.editMessageText("🎵 <b>Perintah Musik & Video:</b>", {
            parse_mode: "HTML",
            reply_markup: Markup.inlineKeyboard([
                [Markup.button.callback("/play <judul/url>", "cmd_play")],
                [Markup.button.callback("/vplay <judul/url>", "cmd_vplay")],
                [Markup.button.callback("/playforce <judul/url>", "cmd_playforce")],
                [Markup.button.callback("/vplayforce <judul/url>", "cmd_vplayforce")],
                [Markup.button.callback("/stop", "cmd_stop"), Markup.button.callback("/skip", "cmd_skip")],
                [Markup.button.callback("/queue", "cmd_queue")],
                [Markup.button.callback("⬅ Kembali", "help")]
            ])
        });
    } catch (error) {
        console.error("❌ Error saat menampilkan perintah musik:", error);
    }
});


// Handler untuk Perintah Umum
bot.action("help_general", async (ctx) => {
    try {
        await ctx.editMessageText("📌 <b>Perintah Umum:</b>", {
            parse_mode: "HTML",
            reply_markup: Markup.inlineKeyboard([
                [Markup.button.callback("/start", "cmd_start")],
                [Markup.button.callback("/help", "cmd_help")],
                [Markup.button.callback("⬅ Kembali", "help")]
            ])
        });
    } catch (error) {
        console.error("❌ Error saat menampilkan perintah umum:", error);
    }
});

bot.command("play", async (ctx) => {
    const query = ctx.message.text.split(" ").slice(1).join(" ");
    if (!query) return ctx.reply("⚠️ Masukkan judul lagu!");

    const response = await startVCG(ctx.chat.id, query);
    if (response) ctx.reply(response);
});

// Handler untuk masing-masing perintah
bot.action("cmd_play", (ctx) => ctx.answerCbQuery("Gunakan /play <judul/url> untuk memutar musik!"));
bot.action("cmd_stop", (ctx) => ctx.answerCbQuery("Gunakan /stop untuk menghentikan musik!"));
bot.action("cmd_skip", (ctx) => ctx.answerCbQuery("Gunakan /skip untuk melewati lagu!"));
bot.action("cmd_queue", (ctx) => ctx.answerCbQuery("Gunakan /queue untuk melihat daftar lagu!"));
bot.action("cmd_start", (ctx) => ctx.answerCbQuery("Gunakan /start untuk memulai bot!"));
bot.action("cmd_help", (ctx) => ctx.answerCbQuery("Gunakan /help untuk melihat daftar perintah!"));

bot.on("callback_query", async (ctx) => {
    const chatId = ctx.message.chat.id;
    const action = ctx.data.split("_")[0];

    if (action === "pause") pauseMusic(chatId, bot);
    else if (action === "resume") resumeMusic(chatId, bot);
    else if (action === "next") skipMusic(chatId, bot);
    else if (action === "close") ctx.deleteMessage();
});

// Jalankan bot
bot.launch().then(() => console.log("✅ Bot telah berjalan!"));

// Menangani proses keluar
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));