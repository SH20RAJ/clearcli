import { describe, it, expect, beforeEach } from '@jest/globals';
import { WindowsTrash } from '../WindowsTrash';

describe('WindowsTrash', () => {
    let windowsTrash: WindowsTrash;

    beforeEach(() => {
        windowsTrash = new WindowsTrash();
    });

    it('should be supported only on Windows', () => {
        const isSupported = windowsTrash.isSupported();

        if (process.platform === 'win32') {
            expect(isSupported).toBe(true);
        } else {
            expect(isSupported).toBe(false);
        }
    });

    it('should get trash size without errors', async () => {
        if (process.platform === 'win32') {
            const size = await windowsTrash.getTrashSize();
            expect(typeof size).toBe('number');
            expect(size).toBeGreaterThanOrEqual(0);
        }
    });

    it('should handle empty paths array', async () => {
        if (process.platform === 'win32') {
            const result = await windowsTrash.moveToTrash([]);
            expect(result).toBe(true);
        }
    });
});