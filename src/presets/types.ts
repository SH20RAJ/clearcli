export interface PresetDefinition {
    name: string;
    description: string;
    patterns: string[];
    excludePatterns?: string[];
    devModeOnly?: boolean;
    systemSafe: boolean;
    category?: string;
    icon?: string;
}