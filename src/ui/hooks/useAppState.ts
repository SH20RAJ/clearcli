import { useState, useCallback, useMemo } from 'react';
import { AppState, ScanResult, ViewType, ModalType, OperationResult } from '../types';
import { fuzzyFilter } from '../utils/fuzzySearch';

interface UseAppStateOptions {
    initialDevMode?: boolean;
    initialPreset?: string;
}

export const useAppState = (options: UseAppStateOptions = {}) => {
    const { initialDevMode = false, initialPreset = undefined } = options;

    const [appState, setAppState] = useState<AppState>({
        // Scan state
        scanResults: [],
        isScanning: false,
        scanProgress: 0,

        // Selection state
        selectedItems: new Set<string>(),
        focusedItem: null,

        // UI state
        currentView: 'scan',
        showModal: false,
        modalType: null,

        // Filter state
        filterText: '',
        activePreset: initialPreset,
        devMode: initialDevMode,

        // Operation state
        isDeleting: false,
        deleteProgress: 0,
        lastOperation: null,
    });

    // Generic state updater
    const updateState = useCallback((updates: Partial<AppState>) => {
        setAppState(prev => ({ ...prev, ...updates }));
    }, []);

    // Scan state management
    const setScanResults = useCallback((results: ScanResult[]) => {
        updateState({ scanResults: results });
    }, [updateState]);

    const setScanning = useCallback((isScanning: boolean, progress = 0) => {
        updateState({ isScanning, scanProgress: progress });
    }, [updateState]);

    // Selection state management
    const updateSelectedItems = useCallback((updater: (prev: Set<string>) => Set<string>) => {
        setAppState(prev => ({
            ...prev,
            selectedItems: updater(prev.selectedItems)
        }));
    }, []);

    const toggleSelection = useCallback((path: string) => {
        updateSelectedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(path)) {
                newSet.delete(path);
            } else {
                newSet.add(path);
            }
            return newSet;
        });
    }, [updateSelectedItems]);

    const selectAll = useCallback(() => {
        updateSelectedItems(() => new Set(appState.scanResults.map(r => r.path)));
    }, [updateSelectedItems, appState.scanResults]);

    const clearSelection = useCallback(() => {
        updateSelectedItems(() => new Set());
    }, [updateSelectedItems]);

    const setFocusedItem = useCallback((path: string | null) => {
        updateState({ focusedItem: path });
    }, [updateState]);

    // UI state management
    const setCurrentView = useCallback((view: ViewType) => {
        updateState({ currentView: view });
    }, [updateState]);

    const showModal = useCallback((modalType: ModalType) => {
        updateState({ showModal: true, modalType });
    }, [updateState]);

    const hideModal = useCallback(() => {
        updateState({ showModal: false, modalType: null });
    }, [updateState]);

    // Filter state management
    const setFilterText = useCallback((filterText: string) => {
        updateState({ filterText });
    }, [updateState]);

    const setActivePreset = useCallback((preset: string | null) => {
        updateState({ activePreset: preset });
    }, [updateState]);

    const toggleDevMode = useCallback(() => {
        updateState({ devMode: !appState.devMode });
    }, [updateState, appState.devMode]);

    // Operation state management
    const setDeleting = useCallback((isDeleting: boolean, progress = 0) => {
        updateState({ isDeleting, deleteProgress: progress });
    }, [updateState]);

    const setLastOperation = useCallback((operation: OperationResult | null) => {
        updateState({ lastOperation: operation });
    }, [updateState]);

    // Computed values - Use fuzzy search for filtering
    const filteredResults = useMemo(() => {
        if (!appState.filterText.trim()) {
            return appState.scanResults.map(item => ({ ...item, fuzzyMatch: { score: 1, matches: [] } }));
        }
        return fuzzyFilter(appState.scanResults, appState.filterText, (item) => item.path);
    }, [appState.scanResults, appState.filterText]);

    // Focus navigation helpers
    const moveFocus = useCallback((direction: 'up' | 'down') => {
        // Use filtered results for navigation
        if (filteredResults.length === 0) return;

        const currentIndex = appState.focusedItem
            ? filteredResults.findIndex(r => r.path === appState.focusedItem)
            : -1;

        let newIndex: number;
        if (direction === 'up') {
            newIndex = currentIndex <= 0 ? filteredResults.length - 1 : currentIndex - 1;
        } else {
            newIndex = currentIndex >= filteredResults.length - 1 ? 0 : currentIndex + 1;
        }

        setFocusedItem(filteredResults[newIndex]?.path || null);
    }, [filteredResults, appState.focusedItem, setFocusedItem]);

    const selectedCount = appState.selectedItems.size;
    const totalSize = appState.scanResults.reduce((sum, result) => sum + result.size, 0);
    const selectedSize = appState.scanResults
        .filter(result => appState.selectedItems.has(result.path))
        .reduce((sum, result) => sum + result.size, 0);

    return {
        // State
        appState,

        // Computed values
        filteredResults,
        selectedCount,
        totalSize,
        selectedSize,

        // State updaters
        updateState,
        setScanResults,
        setScanning,

        // Selection management
        toggleSelection,
        selectAll,
        clearSelection,
        setFocusedItem,
        moveFocus,

        // UI management
        setCurrentView,
        showModal,
        hideModal,

        // Filter management
        setFilterText,
        setActivePreset,
        toggleDevMode,

        // Operation management
        setDeleting,
        setLastOperation,
    };
};