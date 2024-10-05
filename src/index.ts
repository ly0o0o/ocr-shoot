import express from 'express';
import cors from 'cors';
import { config } from './config/config';
import { initializeWorker } from './service/ocrService';
import { watchScreenshots } from './utils/fileWatcher';
import apiRoutes from './routes/api';

const app = express();

app.use(cors());
app.use('/api', apiRoutes);

async function main(): Promise<void> {
    try {
        await initializeWorker();
        await watchScreenshots();

        app.listen(config.PORT, () => {
            console.log(`Server is running on http://localhost:${config.PORT}`);
        });
    } catch (error) {
        console.error('Fatal error in main function:', error);
        process.exit(1);
    }
}

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

main();