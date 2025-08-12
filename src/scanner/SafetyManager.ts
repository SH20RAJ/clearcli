import * as path from 'path';
import * as os from 'os';

export class SafetyManager {
    private static systemPaths: Record<string, string[]> = {
        darwin: [
            '/System',
            '/Library',
            '/Applications',
            '/usr',
            '/bin',
            '/sbin',
            '/etc',
            '/private/etc',
            '/private/var/log',
            '/private/var/db',
            '/dev',
            '/Volumes',
            '/cores',
            '/opt',
            '/Users/Shared',
        ],
        win32: [
            'C:\\Windows',
            'C:\\Program Files',
            'C:\\Program Files (x86)',
            'C:\\ProgramData',
            'C:\\System Volume Information',
            'C:\\Recovery',
            'C:\\$Recycle.Bin',
            'C:\\hiberfil.sys',
            'C:\\pagefile.sys',
            'C:\\swapfile.sys',
        ],
        linux: [
            '/bin',
            '/boot',
            '/dev',
            '/etc',
            '/lib',
            '/lib32',
            '/lib64',
            '/libx32',
            '/proc',
            '/root',
            '/run',
            '/sbin',
            '/sys',
            '/usr',
            '/var/log',
            '/var/lib',
            '/snap',
            '/opt',
        ],
    };

    private static criticalDirectories = [
        // User critical directories
        'Documents',
        'Desktop',
        'Downloads',
        'Pictures',
        'Music',
        'Videos',
        'Library/Application Support',
        'AppData/Roaming',
        'AppData/Local',
        '.ssh',
        '.gnupg',
        '.config',
    ];

    /**
     * Check if a path is a system-protected path that should never be scanned
     */
    static isSystemPath(targetPath: string): boolean {
        const platform = os.platform() as keyof typeof SafetyManager.systemPaths;
        const systemPaths = SafetyManager.systemPaths[platform] || [];

        const normalizedPath = path.resolve(targetPath);

        // Check against system paths for current platform
        for (const systemPath of systemPaths) {
            const normalizedSystemPath = path.resolve(systemPath);

            // Check if target path is within or exactly matches system path
            if (normalizedPath === normalizedSystemPath ||
                normalizedPath.startsWith(normalizedSystemPath + path.sep)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if a path is in a critical user directory that requires extra caution
     */
    static isCriticalUserPath(targetPath: string): boolean {
        const homeDir = os.homedir();
        const normalizedPath = path.resolve(targetPath);

        // Must be within user's home directory
        if (!normalizedPath.startsWith(homeDir + path.sep) && normalizedPath !== homeDir) {
            return false;
        }

        // Check against critical directories
        for (const criticalDir of SafetyManager.criticalDirectories) {
            const criticalPath = path.resolve(homeDir, criticalDir);

            if (normalizedPath === criticalPath ||
                normalizedPath.startsWith(criticalPath + path.sep)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get safe default scan paths for the current platform
     */
    static getSafeDefaultPaths(): string[] {
        const homeDir = os.homedir();
        const platform = os.platform();

        const safePaths = [
            homeDir, // User home directory is generally safe to scan
        ];

        // Add platform-specific safe paths
        if (platform === 'darwin') {
            safePaths.push(
                path.join(homeDir, 'Desktop'),
                path.join(homeDir, 'Documents'),
                path.join(homeDir, 'Downloads'),
            );
        } else if (platform === 'win32') {
            safePaths.push(
                path.join(homeDir, 'Desktop'),
                path.join(homeDir, 'Documents'),
                path.join(homeDir, 'Downloads'),
            );
        } else if (platform === 'linux') {
            safePaths.push(
                path.join(homeDir, 'Desktop'),
                path.join(homeDir, 'Documents'),
                path.join(homeDir, 'Downloads'),
            );
        }

        return safePaths;
    }

    /**
     * Get system-specific exclude patterns to prevent scanning dangerous areas
     */
    static getSystemExcludePatterns(): string[] {
        const platform = os.platform();
        const homeDir = os.homedir();

        const excludePatterns = [
            // Common system excludes
            '.git/objects/**',
            '.svn/**',
            '.hg/**',
            'node_modules/.cache/**',
            '.npm/_cacache/**',
            '.yarn/cache/**',
        ];

        if (platform === 'darwin') {
            excludePatterns.push(
                '/System/**',
                '/Library/**',
                '/Applications/**',
                '/usr/**',
                '/private/**',
                `${homeDir}/Library/Caches/com.apple.**`,
                `${homeDir}/Library/Application Support/com.apple.**`,
            );
        } else if (platform === 'win32') {
            excludePatterns.push(
                'C:/Windows/**',
                'C:/Program Files/**',
                'C:/Program Files (x86)/**',
                'C:/ProgramData/**',
                `${homeDir}/AppData/Local/Microsoft/**`,
                `${homeDir}/AppData/Roaming/Microsoft/**`,
            );
        } else if (platform === 'linux') {
            excludePatterns.push(
                '/bin/**',
                '/boot/**',
                '/dev/**',
                '/etc/**',
                '/lib/**',
                '/proc/**',
                '/root/**',
                '/run/**',
                '/sbin/**',
                '/sys/**',
                '/usr/**',
                '/var/log/**',
                '/var/lib/**',
            );
        }

        return excludePatterns;
    }

    /**
     * Validate that a scan operation is safe to perform
     */
    static validateScanSafety(rootPaths: string[], patterns: string[]): {
        safe: boolean;
        warnings: string[];
        blockedPaths: string[];
    } {
        const warnings: string[] = [];
        const blockedPaths: string[] = [];
        let safe = true;

        for (const rootPath of rootPaths) {
            // Check if scanning system paths
            if (SafetyManager.isSystemPath(rootPath)) {
                blockedPaths.push(rootPath);
                safe = false;
                continue;
            }

            // Check if scanning critical user paths
            if (SafetyManager.isCriticalUserPath(rootPath)) {
                warnings.push(`Scanning critical user directory: ${rootPath}`);
            }
        }

        // Check for overly broad patterns
        const dangerousPatterns = ['*', '**', '**/*'];
        for (const pattern of patterns) {
            if (dangerousPatterns.includes(pattern)) {
                warnings.push(`Broad pattern detected: ${pattern} - consider more specific patterns`);
            }
        }

        return {
            safe,
            warnings,
            blockedPaths,
        };
    }
}