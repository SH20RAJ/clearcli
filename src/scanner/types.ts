export interface ScanResult {
    path: string;
    size: number;
    type: 'file' | 'directory';
    lastModified: Date;
    preset?: string;
    project?: string;
}

export interface ScannerOptions {
    patterns: string[];
    excludePatterns: string[];
    minSize?: number;
    maxDepth?: number;
    followSymlinks: boolean;
}