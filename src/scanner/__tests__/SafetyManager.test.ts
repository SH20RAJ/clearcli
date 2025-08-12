import * as os from 'os';
import * as path from 'path';
import { SafetyManager } from '../SafetyManager';

describe('SafetyManager', () => {
    describe('isSystemPath', () => {
        it('should identify system paths on current platform', () => {
            const platform = os.platform();

            if (platform === 'darwin') {
                expect(SafetyManager.isSystemPath('/System')).toBe(true);
                expect(SafetyManager.isSystemPath('/Library')).toBe(true);
                expect(SafetyManager.isSystemPath('/usr/bin')).toBe(true);
                expect(SafetyManager.isSystemPath('/Users/test')).toBe(false);
            } else if (platform === 'win32') {
                expect(SafetyManager.isSystemPath('C:\\Windows')).toBe(true);
                expect(SafetyManager.isSystemPath('C:\\Program Files')).toBe(true);
                expect(SafetyManager.isSystemPath('C:\\Users\\test')).toBe(false);
            } else if (platform === 'linux') {
                expect(SafetyManager.isSystemPath('/bin')).toBe(true);
                expect(SafetyManager.isSystemPath('/usr')).toBe(true);
                expect(SafetyManager.isSystemPath('/home/test')).toBe(false);
            }
        });

        it('should identify nested system paths', () => {
            const platform = os.platform();

            if (platform === 'darwin') {
                expect(SafetyManager.isSystemPath('/System/Library/Frameworks')).toBe(true);
                expect(SafetyManager.isSystemPath('/usr/local/bin')).toBe(true);
            } else if (platform === 'win32') {
                expect(SafetyManager.isSystemPath('C:\\Windows\\System32')).toBe(true);
                expect(SafetyManager.isSystemPath('C:\\Program Files\\Common Files')).toBe(true);
            } else if (platform === 'linux') {
                expect(SafetyManager.isSystemPath('/usr/local/bin')).toBe(true);
                expect(SafetyManager.isSystemPath('/var/log')).toBe(true);
            }
        });

        it('should not identify user paths as system paths', () => {
            const homeDir = os.homedir();
            expect(SafetyManager.isSystemPath(homeDir)).toBe(false);
            expect(SafetyManager.isSystemPath(path.join(homeDir, 'Documents'))).toBe(false);
            expect(SafetyManager.isSystemPath(path.join(homeDir, 'Desktop'))).toBe(false);
        });
    });

    describe('isCriticalUserPath', () => {
        it('should identify critical user directories', () => {
            const homeDir = os.homedir();

            expect(SafetyManager.isCriticalUserPath(path.join(homeDir, 'Documents'))).toBe(true);
            expect(SafetyManager.isCriticalUserPath(path.join(homeDir, 'Desktop'))).toBe(true);
            expect(SafetyManager.isCriticalUserPath(path.join(homeDir, '.ssh'))).toBe(true);
        });

        it('should not identify non-critical user directories', () => {
            const homeDir = os.homedir();

            expect(SafetyManager.isCriticalUserPath(path.join(homeDir, 'projects'))).toBe(false);
            expect(SafetyManager.isCriticalUserPath(path.join(homeDir, 'temp'))).toBe(false);
        });

        it('should not identify paths outside home directory as critical', () => {
            expect(SafetyManager.isCriticalUserPath('/tmp/Documents')).toBe(false);
            expect(SafetyManager.isCriticalUserPath('/var/Desktop')).toBe(false);
        });
    });

    describe('getSafeDefaultPaths', () => {
        it('should return safe paths including home directory', () => {
            const safePaths = SafetyManager.getSafeDefaultPaths();
            const homeDir = os.homedir();

            expect(safePaths).toContain(homeDir);
            expect(safePaths.length).toBeGreaterThan(0);
        });

        it('should include platform-specific safe paths', () => {
            const safePaths = SafetyManager.getSafeDefaultPaths();
            const homeDir = os.homedir();

            expect(safePaths).toContain(path.join(homeDir, 'Desktop'));
            expect(safePaths).toContain(path.join(homeDir, 'Documents'));
            expect(safePaths).toContain(path.join(homeDir, 'Downloads'));
        });
    });

    describe('getSystemExcludePatterns', () => {
        it('should return platform-specific exclude patterns', () => {
            const excludePatterns = SafetyManager.getSystemExcludePatterns();

            expect(excludePatterns).toContain('.git/objects/**');
            expect(excludePatterns).toContain('.svn/**');
            expect(excludePatterns.length).toBeGreaterThan(5);
        });

        it('should include platform-specific system excludes', () => {
            const excludePatterns = SafetyManager.getSystemExcludePatterns();
            const platform = os.platform();

            if (platform === 'darwin') {
                expect(excludePatterns.some(p => p.includes('/System/'))).toBe(true);
                expect(excludePatterns.some(p => p.includes('/Library/'))).toBe(true);
            } else if (platform === 'win32') {
                expect(excludePatterns.some(p => p.includes('C:/Windows/'))).toBe(true);
                expect(excludePatterns.some(p => p.includes('C:/Program Files/'))).toBe(true);
            } else if (platform === 'linux') {
                expect(excludePatterns.some(p => p.includes('/usr/'))).toBe(true);
                expect(excludePatterns.some(p => p.includes('/var/'))).toBe(true);
            }
        });
    });

    describe('validateScanSafety', () => {
        it('should block system paths', () => {
            const platform = os.platform();
            let systemPath = '/usr';

            if (platform === 'win32') {
                systemPath = 'C:\\Windows';
            } else if (platform === 'darwin') {
                systemPath = '/System';
            }

            const result = SafetyManager.validateScanSafety([systemPath], ['*']);

            expect(result.safe).toBe(false);
            expect(result.blockedPaths).toContain(systemPath);
        });

        it('should allow safe user paths', () => {
            const homeDir = os.homedir();
            const result = SafetyManager.validateScanSafety([homeDir], ['node_modules']);

            expect(result.safe).toBe(true);
            expect(result.blockedPaths).toHaveLength(0);
        });

        it('should warn about critical user paths', () => {
            const homeDir = os.homedir();
            const documentsPath = path.join(homeDir, 'Documents');
            const result = SafetyManager.validateScanSafety([documentsPath], ['*']);

            expect(result.safe).toBe(true);
            expect(result.warnings.some(w => w.includes('critical user directory'))).toBe(true);
        });

        it('should warn about broad patterns', () => {
            const homeDir = os.homedir();
            const result = SafetyManager.validateScanSafety([homeDir], ['*', '**']);

            expect(result.warnings.some(w => w.includes('Broad pattern detected'))).toBe(true);
        });
    });
});