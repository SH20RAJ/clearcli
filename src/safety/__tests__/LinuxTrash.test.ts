import { describe, it, expect, beforeEach } from '@jest/globals';
import { LinuxTrash } from '../LinuxTrash';

describe('LinuxTrash', () => {
    let linuxTrash: LinuxTrash;

    beforeEach(() => {
        linuxTrash = new LinuxTrash();
    });

    it('should be supported only on Linux', () => {
        const isSupported = linuxTrash.isSupported();

        if (process.platform === 'linux') {
            expect(isSupported).toBe(true);
        } else {
            expect(isSupported).toBe(false);
        }
    });

    it('should get trash size without errors', async () => {
        if (process.platform === 'linux') {
            const size = await linuxTrash.getTrashSize();
            expect(typeof size).toBe('number');
            expect(size).toBeGreaterThanOrEqual(0);
        }
    });

    it('should handle empty paths array', async () => {
        if (process.platform === 'linux') {
            const result = await linuxTrash.moveToTrash([]);
            expect(result).toBe(true);
        }
    });
});