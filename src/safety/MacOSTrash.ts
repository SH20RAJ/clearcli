import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { TrashProvider } from './types';

export class MacOSTrash implements TrashProvider {
    private trashPath = join(homedir(), '.Trash');

    async moveToTrash(paths: string[]): Promise<boolean> {
        try {
            // Use osascript to move files to Trash (respects Finder integration)
            for (const path of paths) {
                const escapedPath = path.replace(/'/g, "\\'");
                const script = `tell application "Finder" to delete POSIX file '${escapedPath}'`;

                try {
                    execSync(`osascript -e '${script}'`, {
                        stdio: 'pipe',
                        timeout: 10000
                    });
                } catch (error) {
                    // Fallback: manually move to ~/.Trash
                    await this.fallbackMoveToTrash(path);
                }
            }
            return true;
        } catch (error) {
            console.error('Failed to move files to trash:', error);
            return false;
        }
    }

    private async fallbackMoveToTrash(sourcePath: string): Promise<void> {
        const fileName = sourcePath.split('/').pop() || 'unknown';
        let targetPath = join(this.trashPath, fileName);

        // Handle name conflicts by appending timestamp
        let counter = 1;
        while (await this.pathExists(targetPath)) {
            const timestamp = Date.now();
            const extension = fileName.includes('.') ? fileName.split('.').pop() : '';
            const baseName = extension ? fileName.replace(`.${extension}`, '') : fileName;
            targetPath = join(this.trashPath, `${baseName}_${timestamp}_${counter}${extension ? '.' + extension : ''}`);
            counter++;
        }

        // Ensure trash directory exists
        await fs.mkdir(this.trashPath, { recursive: true });

        // Move the file/directory
        await fs.rename(sourcePath, targetPath);
    }

    async getTrashSize(): Promise<number> {
        try {
            const stats = await this.getDirectorySize(this.trashPath);
            return stats;
        } catch (error) {
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
        } catch (error) {
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

    isSupported(): boolean {
        return process.platform === 'darwin';
    }
}