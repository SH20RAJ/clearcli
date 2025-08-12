export interface TrashProvider {
    /**
     * Move files/directories to the platform's trash/recycle bin
     * @param paths Array of absolute paths to move to trash
     * @returns Promise<boolean> true if successful, false otherwise
     */
    moveToTrash(paths: string[]): Promise<boolean>;

    /**
     * Get the current size of the trash/recycle bin
     * @returns Promise<number> Size in bytes
     */
    getTrashSize(): Promise<number>;

    /**
     * Check if the platform supports native trash functionality
     * @returns boolean true if native trash is available
     */
    isSupported(): boolean;
}

export interface TrashResult {
    success: boolean;
    failedPaths: string[];
    error?: string;
}

export type Platform = 'darwin' | 'win32' | 'linux';

export interface QuarantineEntry {
    id: string;
    originalPath: string;
    quarantinePath: string;
    movedAt: Date;
    size: number;
    metadata: {
        type: 'file' | 'directory';
        permissions?: string;
        owner?: string;
        lastModified?: Date;
        [key: string]: any;
    };
}

export interface QuarantineIndex {
    version: string;
    entries: Record<string, QuarantineEntry>;
    lastUpdated: Date;
}

export interface SafetyValidationResult {
    isValid: boolean;
    warnings: string[];
    blockers: string[];
    systemPaths: string[];
}

export interface DeletionOptions {
    dryRun?: boolean;
    useTrash?: boolean;
    skipConfirmation?: boolean;
    retainInQuarantine?: boolean;
    interactive?: boolean;
}

export interface ConfirmationPrompt {
    message: string;
    details: string[];
    warnings: string[];
    totalSize: number;
    itemCount: number;
    method: 'trash' | 'quarantine';
}

export interface ConfirmationResult {
    confirmed: boolean;
    skipFuture?: boolean;
}

export interface DeletionResult {
    success: boolean;
    processedPaths: string[];
    failedPaths: string[];
    totalSize: number;
    method: 'trash' | 'quarantine';
    dryRun: boolean;
    errors: string[];
}