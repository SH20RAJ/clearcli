import { promises as fs } from 'fs';
import { join, dirname, resolve } from 'path';
import { homedir } from 'os';
import { TrashManager } from './TrashManager';
import { QuarantineManager } from './QuarantineManager';
import { SafetyValidationResult, DeletionOptions, DeletionResult, ConfirmationPrompt, ConfirmationResult } from './types';

export class SafetyManager {
    private trashManager: TrashManager;
    private quarantineManager: QuarantineManager;
    private systemPaths: Set<string>;

    constructor(rootDir?: string) {
        this.trashManager = new TrashManager();
        this.quarantineManager = new QuarantineManager(rootDir);
        this.systemPaths = this.initializeSystemPaths();
    }

    /**
     * Validate paths for safety before deletion
     * @param paths Array of paths to validate
     * @returns SafetyValidationResult with validation details
     */
    async validatePaths(paths: string[]): Promise<SafetyValidationResult> {
        const result: SafetyValidationResult = {
            isValid: true,
            warnings: [],
            blockers: [],
            systemPaths: [],
        };

        for (const path of paths) {
            const resolvedPath = resolve(path);

            // Check if path exists
            try {
                await fs.access(resolvedPath);
            } catch {
                result.warnings.push(`Path does not exist: ${path}`);
                continue;
            }

            // Check for system paths
            if (await this.isSystemPath(resolvedPath)) {
                result.systemPaths.push(path);
                result.blockers.push(`System path detected: ${path}`);
                result.isValid = false;
                continue;
            }

            // Check for critical directories
            if (await this.isCriticalDirectory(resolvedPath)) {
                result.warnings.push(`Critical directory detected: ${path}`);
            }

            // Check for large directories (potential performance impact)
            if (await this.isLargeDirectory(resolvedPath)) {
                result.warnings.push(`Large directory detected: ${path} (may take time to process)`);
            }

            // Check for active files (files currently in use)
            if (await this.isActiveFile(resolvedPath)) {
                result.warnings.push(`File may be in use: ${path}`);
            }
        }

        return result;
    }

    /**
     * Safely delete files with validation and confirmation
     * @param paths Array of paths to delete
     * @param options Deletion options
     * @returns DeletionResult with operation details
     */
    async safeDelete(paths: string[], options: DeletionOptions = {}): Promise<DeletionResult> {
        const {
            dryRun = false,
            useTrash = true,
            skipConfirmation = false,
            retainInQuarantine = false,
        } = options;

        const result: DeletionResult = {
            success: false,
            processedPaths: [],
            failedPaths: [],
            totalSize: 0,
            method: useTrash && this.trashManager.isSupported() ? 'trash' : 'quarantine',
            dryRun,
            errors: [],
        };

        // Handle empty paths array
        if (paths.length === 0) {
            result.success = true;
            return result;
        }

        // Validate paths first
        const validation = await this.validatePaths(paths);

        if (!validation.isValid && !skipConfirmation) {
            result.errors.push('Validation failed: ' + validation.blockers.join(', '));
            return result;
        }

        // Filter out system paths for processing
        const validPaths = paths.filter(path => !validation.systemPaths.includes(path));

        // Calculate total size for valid paths only
        for (const path of validPaths) {
            try {
                const size = await this.calculatePathSize(path);
                result.totalSize += size;
            } catch (error) {
                result.errors.push(`Failed to calculate size for ${path}: ${error}`);
            }
        }

        // If dry run, just return what would be processed
        if (dryRun) {
            result.success = true;
            result.processedPaths = validPaths;
            result.failedPaths = validation.systemPaths;
            return result;
        }

        // Process deletions only for valid paths
        if (validPaths.length === 0) {
            result.success = false;
            result.failedPaths = paths;
            result.errors.push('No valid paths to process');
            return result;
        }

        if (result.method === 'trash' && this.trashManager.isSupported()) {
            try {
                const success = await this.trashManager.moveToTrash(validPaths);
                if (success) {
                    result.processedPaths = validPaths;
                    result.success = true;
                } else {
                    // Fallback to quarantine
                    result.method = 'quarantine';
                    await this.processQuarantine(validPaths, result);
                }
            } catch (error) {
                result.errors.push(`Trash operation failed: ${error}`);
                // Fallback to quarantine
                result.method = 'quarantine';
                await this.processQuarantine(validPaths, result);
            }
        } else {
            // Use quarantine
            await this.processQuarantine(validPaths, result);
        }

        result.failedPaths = validation.systemPaths;
        return result;
    }

    private async processQuarantine(paths: string[], result: DeletionResult): Promise<void> {
        try {
            const entries = await this.quarantineManager.quarantine(paths);
            result.processedPaths = entries.map(entry => entry.originalPath);
            result.success = true;
        } catch (error) {
            result.errors.push(`Quarantine operation failed: ${error}`);
            result.failedPaths.push(...paths);
        }
    }

    /**
     * Restore items from quarantine
     * @param entryId Quarantine entry ID to restore
     * @returns Promise<boolean> true if successful
     */
    async restore(entryId: string): Promise<boolean> {
        return await this.quarantineManager.restore(entryId);
    }

    /**
     * List all quarantined items
     * @returns Promise<QuarantineEntry[]> Array of quarantine entries
     */
    async listQuarantine() {
        return await this.quarantineManager.listQuarantine();
    }

    /**
     * Get the last operation that can be restored
     * @returns Promise<QuarantineEntry | null> Most recent quarantine entry
     */
    async getLastOperation() {
        const entries = await this.quarantineManager.listQuarantine();
        if (entries.length === 0) return null;

        // Sort by movedAt date and return the most recent
        entries.sort((a, b) => new Date(b.movedAt).getTime() - new Date(a.movedAt).getTime());
        return entries[0];
    }

    /**
     * Generate confirmation prompt for deletion operation
     * @param paths Array of paths to be deleted
     * @param options Deletion options
     * @returns Promise<ConfirmationPrompt> Confirmation prompt details
     */
    async generateConfirmationPrompt(paths: string[], options: DeletionOptions = {}): Promise<ConfirmationPrompt> {
        const { useTrash = true } = options;

        // Validate paths first
        const validation = await this.validatePaths(paths);

        // Filter out system paths for processing
        const validPaths = paths.filter(path => !validation.systemPaths.includes(path));

        // Calculate total size
        let totalSize = 0;
        for (const path of validPaths) {
            try {
                totalSize += await this.calculatePathSize(path);
            } catch {
                // Continue if we can't calculate size for a path
            }
        }

        const method = useTrash && this.trashManager.isSupported() ? 'trash' : 'quarantine';

        // Generate confirmation message
        const itemCount = validPaths.length;
        const sizeText = this.formatBytes(totalSize);

        let message: string;
        if (itemCount === 0) {
            message = 'No valid items to delete.';
        } else if (itemCount === 1) {
            const itemName = validPaths[0].split('/').pop() || validPaths[0];
            message = `Delete "${itemName}" (${sizeText})?`;
        } else {
            message = `Delete ${itemCount} items (${sizeText} total)?`;
        }

        // Add method-specific information
        if (method === 'trash') {
            message += ' Items will be moved to trash and can be restored from there.';
        } else {
            message += ' Items will be quarantined and can be restored using clearcli.';
        }

        // Prepare details array
        const details: string[] = [];
        if (validPaths.length <= 10) {
            // Show all paths if there are 10 or fewer
            details.push(...validPaths.map(path => `• ${path}`));
        } else {
            // Show first 8 and indicate there are more
            details.push(...validPaths.slice(0, 8).map(path => `• ${path}`));
            details.push(`... and ${validPaths.length - 8} more items`);
        }

        // Prepare warnings array
        const warnings: string[] = [...validation.warnings];

        if (validation.systemPaths.length > 0) {
            warnings.push(`${validation.systemPaths.length} system paths will be skipped for safety`);
        }

        if (totalSize > 1024 * 1024 * 1024) { // > 1GB
            warnings.push('This operation will free more than 1GB of space');
        }

        return {
            message,
            details,
            warnings,
            totalSize,
            itemCount: validPaths.length,
            method
        };
    }

    /**
     * Perform deletion with interactive confirmation if needed
     * @param paths Array of paths to delete
     * @param options Deletion options
     * @param confirmationCallback Optional callback for interactive confirmation
     * @returns Promise<DeletionResult> Deletion result
     */
    async safeDeleteWithConfirmation(
        paths: string[],
        options: DeletionOptions = {},
        confirmationCallback?: (prompt: ConfirmationPrompt) => Promise<ConfirmationResult>
    ): Promise<DeletionResult> {
        const { interactive = false, skipConfirmation = false } = options;

        // If interactive mode and confirmation callback provided, and not skipping confirmation
        if (interactive && confirmationCallback && !skipConfirmation) {
            const prompt = await this.generateConfirmationPrompt(paths, options);

            // If no valid items to delete, return early
            if (prompt.itemCount === 0) {
                return {
                    success: false,
                    processedPaths: [],
                    failedPaths: paths,
                    totalSize: 0,
                    method: prompt.method,
                    dryRun: false,
                    errors: ['No valid items to delete']
                };
            }

            const confirmation = await confirmationCallback(prompt);

            if (!confirmation.confirmed) {
                return {
                    success: false,
                    processedPaths: [],
                    failedPaths: paths,
                    totalSize: prompt.totalSize,
                    method: prompt.method,
                    dryRun: false,
                    errors: ['Operation cancelled by user']
                };
            }

            // If user chose to skip future confirmations, update options
            if (confirmation.skipFuture) {
                options.skipConfirmation = true;
            }
        }

        // Proceed with normal deletion
        return await this.safeDelete(paths, options);
    }

    /**
     * Validate paths with detailed analysis for confirmation prompts
     * @param paths Array of paths to validate
     * @returns Promise<SafetyValidationResult> Enhanced validation result
     */
    async validatePathsDetailed(paths: string[]): Promise<SafetyValidationResult & {
        criticalPaths: string[];
        largePaths: string[];
        activePaths: string[];
    }> {
        const baseResult = await this.validatePaths(paths);

        const criticalPaths: string[] = [];
        const largePaths: string[] = [];
        const activePaths: string[] = [];

        for (const path of paths) {
            const resolvedPath = resolve(path);

            try {
                await fs.access(resolvedPath);

                if (await this.isCriticalDirectory(resolvedPath)) {
                    criticalPaths.push(path);
                }

                if (await this.isLargeDirectory(resolvedPath)) {
                    largePaths.push(path);
                }

                if (await this.isActiveFile(resolvedPath)) {
                    activePaths.push(path);
                }
            } catch {
                // Skip paths that don't exist
                continue;
            }
        }

        return {
            ...baseResult,
            criticalPaths,
            largePaths,
            activePaths
        };
    }

    /**
     * Check if a path is a system-protected path
     * @param path Path to check
     * @returns Promise<boolean> true if system path
     */
    async isSystemPath(path: string): Promise<boolean> {
        const resolvedPath = resolve(path);

        // Allow temp directories and user directories
        if (resolvedPath.includes('/tmp/') ||
            resolvedPath.includes(homedir()) ||
            resolvedPath.includes('/var/folders/')) {
            return false;
        }

        // Check against known system paths
        for (const systemPath of this.systemPaths) {
            if (resolvedPath.startsWith(systemPath)) {
                return true;
            }
        }

        // Additional runtime checks for root-level system directories
        try {
            const stats = await fs.stat(resolvedPath);

            // Check if it's a system directory by looking at common system characteristics
            if (stats.isDirectory()) {
                // Only check root level directories (not nested ones)
                const pathParts = resolvedPath.split('/').filter(Boolean);
                if (pathParts.length === 1) { // Only root level directories
                    const systemDirNames = ['bin', 'sbin', 'usr', 'etc', 'boot', 'dev', 'proc', 'sys'];
                    if (systemDirNames.includes(pathParts[0])) {
                        return true;
                    }
                }
            }
        } catch {
            // If we can't stat the path, don't assume it's a system path
            return false;
        }

        return false;
    }

    private async isCriticalDirectory(path: string): Promise<boolean> {
        const criticalDirs = [
            '.git',
            'node_modules',
            '.vscode',
            '.idea',
            'package.json',
            'package-lock.json',
            'yarn.lock',
            'Cargo.toml',
            'requirements.txt',
            'pom.xml',
        ];

        const pathName = path.split('/').pop() || '';
        return criticalDirs.includes(pathName);
    }

    private async isLargeDirectory(path: string): Promise<boolean> {
        try {
            const stats = await fs.stat(path);
            if (!stats.isDirectory()) return false;

            // Quick check: if directory has more than 1000 immediate children, consider it large
            const entries = await fs.readdir(path);
            return entries.length > 1000;
        } catch {
            return false;
        }
    }

    private async isActiveFile(path: string): Promise<boolean> {
        try {
            // Try to open the file for writing to check if it's in use
            // This is a simple check and may not catch all cases
            const handle = await fs.open(path, 'r+');
            await handle.close();
            return false;
        } catch (error: any) {
            // If we get EBUSY or similar, file might be in use
            return error.code === 'EBUSY' || error.code === 'ETXTBSY';
        }
    }

    private async calculatePathSize(path: string): Promise<number> {
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

    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 B';

        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    private initializeSystemPaths(): Set<string> {
        const paths = new Set<string>();
        const platform = process.platform;

        if (platform === 'darwin') {
            // macOS system paths (excluding /tmp and /var/folders for temp files)
            paths.add('/System');
            paths.add('/Library');
            paths.add('/Applications');
            paths.add('/bin');
            paths.add('/sbin');
            paths.add('/usr');
            paths.add('/etc');
            paths.add('/dev');
            paths.add('/private/etc');
            paths.add('/private/var/log');
        } else if (platform === 'win32') {
            // Windows system paths
            paths.add('C:\\Windows');
            paths.add('C:\\Program Files');
            paths.add('C:\\Program Files (x86)');
            paths.add('C:\\ProgramData');
            paths.add('C:\\System Volume Information');
            paths.add('C:\\$Recycle.Bin');
        } else if (platform === 'linux') {
            // Linux system paths (excluding /tmp for temp files)
            paths.add('/bin');
            paths.add('/sbin');
            paths.add('/usr');
            paths.add('/etc');
            paths.add('/var/log');
            paths.add('/var/lib');
            paths.add('/boot');
            paths.add('/dev');
            paths.add('/proc');
            paths.add('/sys');
            paths.add('/root');
        }

        return paths;
    }
}