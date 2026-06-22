const fs = require("fs");
const path = require("path");

const cron = require("node-cron");

const env = require("../config/env");
const { uploadRoot } = require("../middleware/upload");

async function cleanupExpiredUploads() {
  const cutoff = Date.now() - env.TEMP_FILE_TTL_MINUTES * 60 * 1000;
  const entries = await fs.promises.readdir(uploadRoot, { withFileTypes: true }).catch(() => []);

  await Promise.all(entries.map(async entry => {
    if (!entry.isFile()) return;

    const filePath = path.join(uploadRoot, entry.name);
    const stat = await fs.promises.stat(filePath).catch(() => null);
    if (!stat || stat.mtimeMs > cutoff) return;

    await fs.promises.unlink(filePath).catch(() => {});
  }));
}

function startUploadCleanupJob() {
  cron.schedule("*/15 * * * *", () => {
    cleanupExpiredUploads().catch(err => console.error("Upload cleanup failed:", err));
  });
}

module.exports = {
  cleanupExpiredUploads,
  startUploadCleanupJob
};
