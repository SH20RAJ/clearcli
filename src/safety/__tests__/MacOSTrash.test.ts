import { describe, it, expect, beforeEach } from '@jest/globals';
import { MacOSTrash } from '../MacOSTrash';

describe('MacOSTrash', () => {
    let macOSTrash: MacOSTrash;

    beforeEach(() => {
        macOSTrash = new MacOSTrash();
    });

    it('should be supported only on macOS', () => {
        const isSupported = macOSTrash.isSupported();

        if (process.platform === 'darwin') {
            expect(isSupported).toBe(true);
        } else {
            expect(isSupported).toBe(false);
        }
    });

    it('should get trash size without errors', async () => {
        if (process.platform === 'darwin') {
            const size = await macOSTrash.getTrashSize();
            expect(typeof size).toBe('number');
            expect(size).toBeGreaterThanOrEqual(0);
        }
    });

    it('should handle empty paths array', async () => {
        if (process.platform === 'darwin') {
            const result = await macOSTrash.moveToTrash([]);
            expect(result).toBe(true);
        }
    });
});