import { TrashProvider, Platform } from './types';
import { MacOSTrash } from './MacOSTrash';
import { WindowsTrash } from './WindowsTrash';
import { LinuxTrash } from './LinuxTrash';

export class TrashManager {
    private provider: TrashProvider;

    constructor() {
        this.provider = this.createProvider();
    }

    private createProvider(): TrashProvider {
        const platform = process.platform as Platform;

        switch (platform) {
            case 'darwin':
                return new MacOSTrash();
            case 'win32':
                return new WindowsTrash();
            case 'linux':
                return new LinuxTrash();
            default:
                throw new Error(`Unsupported platform: ${platform}`);
        }
    }

    /**
     * Move files/directories to the platform's trash/recycle bin
     * @param paths Array of absolute paths to move to trash
     * @returns Promise<boolean> true if successful, false otherwise
     */
    async moveToTrash(paths: string[]): Promise<boolean> {
        if (!this.provider.isSupported()) {
            throw new Error(`Trash functionality not supported on ${process.platform}`);
        }

        if (paths.length === 0) {
            return true;
        }

        return await this.provider.moveToTrash(paths);
    }

    /**
     * Get the current size of the trash/recycle bin
     * @returns Promise<number> Size in bytes
     */
    async getTrashSize(): Promise<number> {
        if (!this.provider.isSupported()) {
            return 0;
        }

        return await this.provider.getTrashSize();
    }

    /**
     * Check if trash functionality is supported on the current platform
     * @returns boolean true if supported
     */
    isSupported(): boolean {
        return this.provider.isSupported();
    }

    /**
     * Get the current platform
     * @returns Platform current platform identifier
     */
    getPlatform(): Platform {
        return process.platform as Platform;
    }
}