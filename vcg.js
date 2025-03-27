const { TelegramClient } = require("gramjs");
const { StringSession } = require("gramjs/sessions");
const { Api } = require("gramjs/tl");
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");

const { downloadMusic } = require("./playmusic"); // Ambil fungsi downloadMusic dari playmusic.js
const config = require("./config");
const sesi = path.join(__dirname, "sessions", "session.txt");

const client = new TelegramClient(
    new StringSession(sesi),
    config.GRAMJS.API_ID,
    config.GRAMJS.API_HASH,
    { connectionRetries: 5 }
);

// Cek apakah bot adalah admin dengan izin "Manage Voice Chats"
async function isBotAdmin(chatId) {
    try {
        await client.connect();
        const chat = await client.invoke(new Api.channels.GetParticipant({
            channel: chatId,
            participant: "me"
        }));

        const botInfo = chat.participant;
        return botInfo.admin_rights?.manage_call || false;
    } catch (error) {
        console.error("❌ Gagal memeriksa status admin:", error);
        return false;
    }
}

// Memutar musik di VCG
async function startVCG(chatId, query) {
    try {
        const isAdmin = await isBotAdmin(chatId);
        if (!isAdmin) return "❌ Bot harus menjadi admin dengan izin 'Manage Voice Chats'.";

        const filePath = await downloadMusic(query);
        if (!filePath) return "⚠️ Tidak bisa memutar lagu.";

        console.log(`🔁 Mengonversi ${filePath} ke OPUS...`);
        const streamPath = filePath.replace(".mp3", ".opus");

        await new Promise((resolve, reject) => {
            ffmpeg(filePath)
                .audioCodec("libopus")
                .audioBitrate("96k")
                .audioFilters([
    "loudnorm=I=-16:LRA=11:TP=-1.5", // Normalisasi suara agar lebih jernih
    "equalizer=f=1000:width_type=o:width=2:g=3" // Menambah kejernihan suara
])
                .toFormat("opus")
                .on("end", resolve)
                .on("error", reject)
                .save(streamPath);
        });

        console.log(`✅ Siap memutar lagu di VCG: ${streamPath}`);

        // Mulai VCG
        const call = await client.invoke(
            new Api.phone.CreateGroupCall({
                peer: chatId,
                random_id: Math.floor(Math.random() * 100000),
            })
        );

        await client.invoke(
            new Api.phone.JoinGroupCall({
                call: call.id,
                join_as: chatId,
                params: { stream: streamPath },
            })
        );

        console.log("🎶 Musik berhasil diputar di VCG!");
    } catch (error) {
        console.error("❌ Gagal memutar musik di VCG:", error);
    }
}

module.exports = { startVCG };