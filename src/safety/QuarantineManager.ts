import { promises as fs } from 'fs';
import { join, dirname, basename } from 'path';
import { homedir } from 'os';
import { randomUUID } from 'crypto';
import { QuarantineEntry, QuarantineIndex } from './types';

export class QuarantineManager {
    private quarantineDir: string;
    private indexPath: string;
    private readonly VERSION = '1.0.0';

    constructor(rootDir?: string) {
        const baseDir = rootDir || join(homedir(), '.cleancli');
        this.quarantineDir = join(baseDir, 'quarantine');
        this.indexPath = join(baseDir, 'quarantine-index.json');
    }

    /**
     * Move files/directories to quarantine with full metadata tracking
     * @param paths Array of absolute paths to quarantine
     * @returns Promise<QuarantineEntry[]> Array of quarantine entries created
     */
    async quarantine(paths: string[]): Promise<QuarantineEntry[]> {
        if (paths.length === 0) {
            return [];
        }

        // Ensure quarantine directory exists
        await fs.mkdir(this.quarantineDir, { recursive: true });
        await fs.mkdir(dirname(this.indexPath), { recursive: true });

        const entries: QuarantineEntry[] = [];
        const index = await this.loadIndex();

        for (const path of paths) {
            try {
                const entry = await this.quarantineFile(path);
                entries.push(entry);
                index.entries[entry.id] = entry;
            } catch (error) {
                console.error(`Failed to quarantine ${path}:`, error);
            }
        }

        // Update index
        index.lastUpdated = new Date();
        await this.saveIndex(index);

        return entries;
    }

    private async quarantineFile(sourcePath: string): Promise<QuarantineEntry> {
        const stats = await fs.stat(sourcePath);
        const id = randomUUID();
        const fileName = basename(sourcePath);
        const quarantinePath = join(this.quarantineDir, `${id}_${fileName}`);

        // Collect metadata
        const metadata = {
            type: stats.isDirectory() ? 'directory' as const : 'file' as const,
            permissions: stats.mode.toString(8),
            lastModified: stats.mtime,
            size: stats.size,
        };

        // Move file to quarantine
        await fs.rename(sourcePath, quarantinePath);

        const entry: QuarantineEntry = {
            id,
            originalPath: sourcePath,
            quarantinePath,
            movedAt: new Date(),
            size: await this.calculateSize(quarantinePath),
            metadata,
        };

        return entry;
    }

    /**
     * Restore a quarantined item back to its original location
     * @param entryId The ID of the quarantine entry to restore
     * @returns Promise<boolean> true if successful, false otherwise
     */
    async restore(entryId: string): Promise<boolean> {
        try {
            const index = await this.loadIndex();
            const entry = index.entries[entryId];

            if (!entry) {
                throw new Error(`Quarantine entry ${entryId} not found`);
            }

            // Check if quarantined file still exists
            try {
                await fs.access(entry.quarantinePath);
            } catch {
                throw new Error(`Quarantined file ${entry.quarantinePath} no longer exists`);
            }

            // Ensure target directory exists
            await fs.mkdir(dirname(entry.originalPath), { recursive: true });

            // Handle name conflicts at restore location
            let restorePath = entry.originalPath;
            let counter = 1;
            while (await this.pathExists(restorePath)) {
                const ext = entry.originalPath.includes('.') ? entry.originalPath.split('.').pop() : '';
                const baseName = ext ? entry.originalPath.replace(`.${ext}`, '') : entry.originalPath;
                restorePath = `${baseName}_restored_${counter}${ext ? '.' + ext : ''}`;
                counter++;
            }

            // Move file back
            await fs.rename(entry.quarantinePath, restorePath);

            // Remove from index
            delete index.entries[entryId];
            index.lastUpdated = new Date();
            await this.saveIndex(index);

            return true;
        } catch (error) {
            console.error(`Failed to restore ${entryId}:`, error);
            return false;
        }
    }

    /**
     * List all quarantined items
     * @returns Promise<QuarantineEntry[]> Array of all quarantine entries
     */
    async listQuarantine(): Promise<QuarantineEntry[]> {
        const index = await this.loadIndex();
        return Object.values(index.entries);
    }

    /**
     * Get a specific quarantine entry by ID
     * @param entryId The ID of the entry to retrieve
     * @returns Promise<QuarantineEntry | null> The entry or null if not found
     */
    async getEntry(entryId: string): Promise<QuarantineEntry | null> {
        const index = await this.loadIndex();
        return index.entries[entryId] || null;
    }

    /**
     * Remove old quarantine entries based on retention policy
     * @param retentionDays Number of days to keep quarantined items
     * @returns Promise<number> Number of entries cleaned up
     */
    async cleanup(retentionDays: number = 30): Promise<number> {
        const index = await this.loadIndex();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

        let cleanedCount = 0;
        const entriesToRemove: string[] = [];

        for (const [id, entry] of Object.entries(index.entries)) {
            if (new Date(entry.movedAt) < cutoffDate) {
                try {
                    // Remove quarantined file
                    await fs.rm(entry.quarantinePath, { recursive: true, force: true });
                    entriesToRemove.push(id);
                    cleanedCount++;
                } catch (error) {
                    console.error(`Failed to cleanup quarantine entry ${id}:`, error);
                }
            }
        }

        // Update index
        for (const id of entriesToRemove) {
            delete index.entries[id];
        }

        if (entriesToRemove.length > 0) {
            index.lastUpdated = new Date();
            await this.saveIndex(index);
        }

        return cleanedCount;
    }

    /**
     * Get total size of all quarantined items
     * @returns Promise<number> Total size in bytes
     */
    async getTotalSize(): Promise<number> {
        const entries = await this.listQuarantine();
        return entries.reduce((total, entry) => total + entry.size, 0);
    }

    /**
     * Clear all quarantined items (permanent deletion)
     * @returns Promise<number> Number of items cleared
     */
    async clearAll(): Promise<number> {
        const entries = await this.listQuarantine();
        let clearedCount = 0;

        for (const entry of entries) {
            try {
                await fs.rm(entry.quarantinePath, { recursive: true, force: true });
                clearedCount++;
            } catch (error) {
                console.error(`Failed to clear quarantine entry ${entry.id}:`, error);
            }
        }

        // Reset index
        const index: QuarantineIndex = {
            version: this.VERSION,
            entries: {},
            lastUpdated: new Date(),
        };
        await this.saveIndex(index);

        return clearedCount;
    }

    private async loadIndex(): Promise<QuarantineIndex> {
        try {
            const data = await fs.readFile(this.indexPath, 'utf8');
            const index = JSON.parse(data) as QuarantineIndex;

            // Convert date strings back to Date objects
            index.lastUpdated = new Date(index.lastUpdated);
            for (const entry of Object.values(index.entries)) {
                entry.movedAt = new Date(entry.movedAt);
                if (entry.metadata.lastModified) {
                    entry.metadata.lastModified = new Date(entry.metadata.lastModified);
                }
            }

            return index;
        } catch (error) {
            // Return empty index if file doesn't exist or is corrupted
            return {
                version: this.VERSION,
                entries: {},
                lastUpdated: new Date(),
            };
        }
    }

    private async saveIndex(index: QuarantineIndex): Promise<void> {
        const data = JSON.stringify(index, null, 2);
        await fs.writeFile(this.indexPath, data, 'utf8');
    }

    private async calculateSize(path: string): Promise<number> {
        try {
            const stats = await fs.stat(path);
            if (stats.isDirectory()) {
                return await this.getDirectorySize(path);
            } else {
                return stats.size;
            }
        } catch {
            return 0;
        }
    }

    private async getDirectorySize(dirPath: string): Promise<number> {
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            let totalSize = 0;

            for (const entry of entries) {
                const fullPath = join(dirPath, entry.name);
                if (entry.isDirectory()) {
                    totalSize += await this.getDirectorySize(fullPath);
                } else {
                    const stats = await fs.stat(fullPath);
                    totalSize += stats.size;
                }
            }

            return totalSize;
        } catch {
            return 0;
        }
    }

    private async pathExists(path: string): Promise<boolean> {
        try {
            await fs.access(path);
            return true;
        } catch {
            return false;
        }
    }
}