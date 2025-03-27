const fs = require("fs").promises;
const path = require("path");

const CACHE_DIR = path.join(__dirname, "cache");
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000; // 7 hari dalam milidetik

// Fungsi untuk menghapus file lama
async function cleanCache() {
  try {
    // Pastikan folder cache ada
    await fs.mkdir(CACHE_DIR, { recursive: true });

    const files = await fs.readdir(CACHE_DIR);
    if (files.length === 0) {
      console.log("✅ Tidak ada file lama untuk dihapus.");
      return;
    }

    const now = Date.now();
    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(CACHE_DIR, file);
      const stat = await fs.stat(filePath);

      if (now - stat.mtimeMs > SEVEN_DAYS) {
        await fs.unlink(filePath);
        deletedCount++;
        console.log(`🗑️ File dihapus: ${file}`);
      }
    }

    if (deletedCount === 0) {
      console.log("✅ Tidak ada file yang perlu dihapus.");
    } else {
      console.log(`🔥 ${deletedCount} file telah dihapus.`);
    }
  } catch (err) {
    console.error("❌ Error saat membersihkan cache:", err);
  }
}

// Fungsi untuk menjadwalkan pembersihan setiap pukul 00:00
function scheduleCleaner() {
  const now = new Date();
  const nextMidnight = new Date(now);
  nextMidnight.setHours(24, 0, 0, 0); // Atur waktu ke 00:00 hari berikutnya

  const delay = nextMidnight - now; // Hitung waktu menuju tengah malam
  console.log(`⏳ Pembersihan cache akan dijalankan dalam ${Math.round(delay / 1000 / 60)} menit.`);

  setTimeout(() => {
    cleanCache();
    scheduleCleaner(); // Jadwalkan ulang setelah pembersihan selesai
  }, delay);
}

// Jalankan pertama kali saat bot dimulai
 // Cek setiap menit

module.exports = { cleanCache };