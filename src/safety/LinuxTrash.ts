import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { TrashProvider } from './types';

export class LinuxTrash implements TrashProvider {
    private trashPath = join(homedir(), '.local', 'share', 'Trash');
    private filesPath = join(this.trashPath, 'files');
    private infoPath = join(this.trashPath, 'info');

    async moveToTrash(paths: string[]): Promise<boolean> {
        try {
            // Try gio trash first (GNOME/modern Linux)
            if (await this.tryGioTrash(paths)) {
                return true;
            }

            // Try trash-cli as fallback
            if (await this.tryTrashCli(paths)) {
                return true;
            }

            // Manual implementation as last resort
            return await this.manualMoveToTrash(paths);
        } catch (error) {
            console.error('Failed to move files to trash:', error);
            return false;
        }
    }

    private async tryGioTrash(paths: string[]): Promise<boolean> {
        try {
            for (const path of paths) {
                execSync(`gio trash "${path}"`, {
                    stdio: 'pipe',
                    timeout: 10000
                });
            }
            return true;
        } catch {
            return false;
        }
    }

    private async tryTrashCli(paths: string[]): Promise<boolean> {
        try {
            const pathsArg = paths.map(p => `"${p}"`).join(' ');
            execSync(`trash-put ${pathsArg}`, {
                stdio: 'pipe',
                timeout: 10000
            });
            return true;
        } catch {
            return false;
        }
    }

    private async manualMoveToTrash(paths: string[]): Promise<boolean> {
        try {
            // Ensure trash directories exist
            await fs.mkdir(this.filesPath, { recursive: true });
            await fs.mkdir(this.infoPath, { recursive: true });

            for (const path of paths) {
                await this.moveFileToTrash(path);
            }
            return true;
        } catch (error) {
            console.error('Manual trash move failed:', error);
            return false;
        }
    }

    private async moveFileToTrash(sourcePath: string): Promise<void> {
        const fileName = sourcePath.split('/').pop() || 'unknown';
        const timestamp = new Date().toISOString();

        // Handle name conflicts
        let targetFileName = fileName;
        let counter = 1;
        while (await this.pathExists(join(this.filesPath, targetFileName))) {
            const extension = fileName.includes('.') ? fileName.split('.').pop() : '';
            const baseName = extension ? fileName.replace(`.${extension}`, '') : fileName;
            targetFileName = `${baseName}_${counter}${extension ? '.' + extension : ''}`;
            counter++;
        }

        const targetPath = join(this.filesPath, targetFileName);
        const infoFile = join(this.infoPath, `${targetFileName}.trashinfo`);

        // Create .trashinfo file
        const trashInfo = `[Trash Info]
Path=${sourcePath}
DeletionDate=${timestamp}
`;
        await fs.writeFile(infoFile, trashInfo);

        // Move the actual file
        await fs.rename(sourcePath, targetPath);
    }

    async getTrashSize(): Promise<number> {
        try {
            return await this.getDirectorySize(this.filesPath);
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
        return process.platform === 'linux';
    }
}