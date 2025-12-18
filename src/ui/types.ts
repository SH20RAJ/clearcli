/**
 * Type definitions for the UI components and state management
 */

export interface ScanResult {
    path: string;
    size: number;
    type: 'file' | 'directory';
    lastModified: Date;
    preset?: string;
    project?: string;
}

export interface OperationResult {
    type: 'delete' | 'restore';
    itemsProcessed: number;
    spaceFreed: number;
    errors: string[];
    timestamp: Date;
}

export interface AppState {
    // Scan state
    scanResults: ScanResult[];
    isScanning: boolean;
    scanProgress: number;

    // Selection state
    selectedItems: Set<string>;
    focusedItem: string | null;

    // UI state
    currentView: 'scan' | 'preview' | 'bigfiles' | 'quarantine';
    showModal: boolean;
    modalType: 'confirm' | 'help' | 'settings' | null;

    // Filter state
    filterText: string;
    activePreset: string | null | undefined;
    devMode: boolean;

    // Operation state
    isDeleting: boolean;
    deleteProgress: number;
    lastOperation: OperationResult | null;
}

export type ViewType = 'scan' | 'preview' | 'bigfiles' | 'quarantine';
export type ModalType = 'confirm' | 'help' | 'settings';

export interface KeyHandler {
    key: string;
    handler: () => void;
    description: string;
}