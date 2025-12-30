import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as Minio from 'minio';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { format, subDays } from 'date-fns';
import * as util from 'util';

const execPromise = util.promisify(exec);

@Injectable()
export class BackupService implements OnModuleInit {
    private readonly logger = new Logger(BackupService.name);
    private minioClient: Minio.Client;
    private readonly bucketName = 'backups';
    private readonly retentionDays = 7;

    constructor() {
        this.minioClient = new Minio.Client({
            endPoint: process.env.MINIO_ENDPOINT_HOST || 'minio',
            port: parseInt(process.env.MINIO_PORT || '9000'),
            useSSL: false,
            accessKey: process.env.MINIO_ROOT_USER || 'minioadmin',
            secretKey: process.env.MINIO_ROOT_PASSWORD || 'minioadmin',
        });
    }

    async onModuleInit() {
        this.logger.log('Backup Service Initialized. Scheduled for EVERY_DAY_AT_2AM.');
    }

    @Cron(CronExpression.EVERY_DAY_AT_2AM)
    async handleCron() {
        this.logger.log('Starting automated database backup...');
        const fileName = `backup-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.sql`;
        const filePath = path.join('/tmp', fileName);

        try {
            await this.ensureBucket();

            // 1. Dump Database
            this.logger.log(`Dumping database to ${filePath}...`);
            const dbHost = process.env.DB_HOST || 'postgres';
            const dbUser = process.env.DB_USER || 'postgres';
            const dbName = process.env.DB_NAME || 'datn_db';
            const dbPassword = process.env.DB_PASSWORD || 'postgres';

            // Use PGPASSWORD env variable to avoid password prompt
            // Note: In production, careful with logging command if it contains secrets.
            const command = `PGPASSWORD='${dbPassword}' pg_dump -h ${dbHost} -U ${dbUser} -d ${dbName} -f ${filePath}`;
            await execPromise(command);

            // 2. Upload to MinIO
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                this.logger.log(`Uploading dump to MinIO (${(stats.size / 1024 / 1024).toFixed(2)} MB)...`);
                await this.minioClient.fPutObject(this.bucketName, fileName, filePath);
                this.logger.log('Upload successful.');
            } else {
                throw new Error('Dump file not found after pg_dump');
            }

            // 3. Clean up local file
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            this.logger.log('Local temporary selection cleaned up.');

            // 4. Cleanup old backups
            await this.cleanupOldBackups();

        } catch (error) {
            this.logger.error('Backup failed', error);
            // Try verify clean up if validation failed
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
    }

    private async ensureBucket() {
        try {
            const exists = await this.minioClient.bucketExists(this.bucketName);
            if (!exists) {
                await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
                this.logger.log(`Created bucket: ${this.bucketName}`);
            }
        } catch (err) {
            this.logger.error('Error ensuring bucket exists', err);
            throw err;
        }
    }

    private async cleanupOldBackups() {
        this.logger.log('Checking for old backups to clean up...');
        const stream = this.minioClient.listObjects(this.bucketName, '', true);
        const now = new Date();

        stream.on('data', async (obj) => {
            if (obj.lastModified) {
                const fileDate = new Date(obj.lastModified);
                const diffTime = Math.abs(now.getTime() - fileDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays > this.retentionDays) {
                    this.logger.log(`Deleting old backup: ${obj.name} (${diffDays} days old)`);
                    try {
                        await this.minioClient.removeObject(this.bucketName, obj.name);
                    } catch (e) {
                        this.logger.error(`Failed to delete ${obj.name}`, e);
                    }
                }
            }
        });

        stream.on('error', (err) => {
            this.logger.error('Error listing objects for cleanup', err);
        });
    }
}
