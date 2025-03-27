const fs = require("fs");
const path = require("path");
const { TelegramClient } = require("gramjs");
const { StringSession } = require("gramjs/sessions");
const input = require("input"); // Untuk menerima input dari terminal
const config = require("./config"); // Import config.js

const SESSION_FILE = path.join(__dirname, "sessions", "session.txt");

// Pastikan folder "sessions" ada
if (!fs.existsSync(path.dirname(SESSION_FILE))) {
    fs.mkdirSync(path.dirname(SESSION_FILE), { recursive: true });
}

// Cek apakah String Session sudah ada
let sessionString = "";
if (fs.existsSync(SESSION_FILE)) {
    sessionString = fs.readFileSync(SESSION_FILE, "utf-8").trim();
}

const client = new TelegramClient(
    new StringSession(sessionString),
    config.TELEGRAM.API_ID,
    config.TELEGRAM.API_HASH,
    { connectionRetries: 5 }
);

async function startGramClient() {
    if (!sessionString) {
        console.log("🔑 String Session belum ada, membuat session baru...");
        
        await client.start({
            phoneNumber: async () => await input.text("Masukkan Nomor Telepon: "),
            password: async () => await input.text("Masukkan Password (jika ada): "),
            phoneCode: async () => await input.text("Masukkan Kode OTP yang diterima: "),
            onError: (err) => console.log(err),
        });

        console.log("✅ Login berhasil!");
        const newSession = client.session.save();
        fs.writeFileSync(SESSION_FILE, newSession, "utf-8");
        console.log(`💾 String Session disimpan di: ${SESSION_FILE}`);
    }

    await client.connect();
    console.log("✅ GramJS Client Connected!");
}

module.exports = { client, startGramClient };