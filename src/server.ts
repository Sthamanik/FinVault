import 'dotenv/config';
import app from './app.js';
import connectDB from '@config/db.js';
import logger from '@utils/logger.utils.js';
import '@config/redis.config.js';
import "@workers/email.worker.js";
import "@workers/r2.worker.js"; 
import { cleanStaleTmpFiles } from '@utils/cleanTmp.utils.js';

const PORT = process.env.PORT || 5001;

connectDB()
  .then(() => {
    cleanStaleTmpFiles(); // sweep on boot

    // Then sweep every 15 min while running
    setInterval(cleanStaleTmpFiles, 15 * 60 * 1000);    

    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    server.on('error', (err: Error) => {
        logger.error(`Express server error: ${err.message}`);
        process.exit(1);
    });

  })
  .catch((err) => {
    logger.error('MongoDB connection failed:', err);
    process.exit(1);
  });