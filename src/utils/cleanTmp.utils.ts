import fs from "fs";
import path from "path";
import logger from "@utils/logger.utils.js";

const MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

export const cleanStaleTmpFiles = (dir = "tmp") => {
  try {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);
    const now = Date.now();
    let cleaned = 0;

    for (const file of files) {
      const filePath = path.join(dir, file);
      try {
        const stat = fs.statSync(filePath);
        if (now - stat.mtimeMs > MAX_AGE_MS) {
          fs.unlinkSync(filePath);
          cleaned++;
          logger.info(`[cleanTmp] Removed stale file: ${file}`);
        }
      } catch (err) {
        logger.error(`[cleanTmp] Could not process ${file}: ${err}`);
      }
    }

    if (cleaned > 0) logger.info(`[cleanTmp] Cleaned ${cleaned} stale file(s)`);
  } catch (err) {
    logger.error(`[cleanTmp] Failed to read tmp dir: ${err}`);
  }
};