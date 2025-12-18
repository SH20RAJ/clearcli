import React, { useEffect, useState } from 'react';
import { useAppState } from './hooks/useAppState';
import {
    Header,
    StatusBar,
    ResultsList,
    PreviewPane,
    SearchFilter,
    ConfirmationModal,
    HelpModal,
    ProgressModal
} from './components';
import { ScanResult } from './types';

interface CompleteAppProps {
    initialDevMode?: boolean;
    initialPreset?: string;
}

export const CompleteApp: React.FC<CompleteAppProps> = ({
    initialDevMode = false,
    initialPreset = undefined
}) => {
    // Use custom hooks for state management
    const {
        appState,
        selectedCount,
        toggleSelection,
        selectAll,
        clearSelection,
        setCurrentView,
        showModal,
        hideModal,
        moveFocus,
        setFocusedItem,
        setFilterText,
        setScanResults,
        setScanning,
        setDeleting
    } = useAppState({ initialDevMode, initialPreset });

    const [isSearchActive, setIsSearchActive] = useState(false);
    const [keyHandlers] = useState([
        { key: 'q', handler: () => { }, description: 'Quit application' },
        { key: 'j', handler: () => { }, description: 'Move focus down' },
        { key: 'k', handler: () => { }, description: 'Move focus up' },
        { key: 'space', handler: () => { }, description: 'Toggle selection' },
        { key: 'a', handler: () => { }, description: 'Select all items' },
        { key: 'c', handler: () => { }, description: 'Clear selection' },
        { key: '?', handler: () => { }, description: 'Show help' },
        { key: 'escape', handler: () => { }, description: 'Close modal' },
        { key: 's', handler: () => { }, description: 'Switch to scan view' },
        { key: 'b', handler: () => { }, description: 'Switch to big files view' },
        { key: 'r', handler: () => { }, description: 'Switch to quarantine view' }
    ]);

    // Mock some sample data for demonstration
    useEffect(() => {
        const mockResults: ScanResult[] = [
            {
                path: '/Users/test/project/node_modules',
                size: 150000000,
                type: 'directory',
                lastModified: new Date('2024-01-15'),
                preset: 'node',
                project: 'my-app'
            },
            {
                path: '/Users/test/project/.next',
                size: 50000000,
                type: 'directory',
                lastModified: new Date('2024-01-14'),
                preset: 'node'
            },
            {
                path: '/Users/test/Downloads/large-file.zip',
                size: 200000000,
                type: 'file',
                lastModified: new Date('2024-01-10')
            },
            {
                path: '/Users/test/project/dist',
                size: 25000000,
                type: 'directory',
                lastModified: new Date('2024-01-12'),
                preset: 'node'
            },
            {
                path: '/Users/test/.cache/pip',
                size: 75000000,
                type: 'directory',
                lastModified: new Date('2024-01-08'),
                preset: 'python'
            }
        ];

        // Set mock data if we don't have any results yet
        if (appState.scanResults.length === 0) {
            setScanResults(mockResults);
        }
    }, [appState.scanResults.length, setScanResults]);

    // Initialize focus on first scan result
    useEffect(() => {
        if (appState.scanResults.length > 0 && !appState.focusedItem) {
            setFocusedItem(appState.scanResults[0].path);
        }
    }, [appState.scanResults, appState.focusedItem, setFocusedItem]);

    const handleToggleSelection = (path: string) => {
        toggleSelection(path);
    };

    const handleFocusChange = (path: string) => {
        setFocusedItem(path);
    };

    const handleFilterChange = (text: string) => {
        setFilterText(text);
    };

    const handleDeleteSelected = () => {
        if (selectedCount === 0) return;
        showModal('confirm');
    };

    const handleConfirmDelete = async () => {
        hideModal();
        setDeleting(true, 0);

        // Simulate deletion progress
        for (let i = 0; i <= 100; i += 10) {
            await new Promise(resolve => setTimeout(resolve, 100));
            setDeleting(true, i / 100);
        }

        // Clear selected items and stop deletion
        clearSelection();
        setDeleting(false, 0);
    };

    const handleStartScan = async () => {
        setScanning(true, 0);

        // Simulate scanning progress
        for (let i = 0; i <= 100; i += 5) {
            await new Promise(resolve => setTimeout(resolve, 50));
            setScanning(true, i / 100);
        }

        setScanning(false, 0);
    };

    const formatSize = (bytes: number): string => {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return `${size.toFixed(1)} ${units[unitIndex]}`;
    };

    const selectedSize = appState.scanResults
        .filter(result => appState.selectedItems.has(result.path))
        .reduce((sum, result) => sum + result.size, 0);

    return React.createElement('div',
        {
            style: {
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: 'monospace',
                backgroundColor: '#fafafa'
            }
        },
        // Header
        React.createElement(Header, {
            currentView: appState.currentView,
            devMode: appState.devMode,
            activePreset: appState.activePreset
        }),

        // Search Filter (when active)
        isSearchActive && React.createElement(SearchFilter, {
            filterText: appState.filterText,
            onFilterChange: handleFilterChange,
            placeholder: 'Type to filter results... (ESC to close)',
            isActive: isSearchActive
        }),

        // Main content area
        React.createElement('div',
            {
                style: {
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'row',
                    overflow: 'hidden',
                    gap: '1px'
                }
            },
            // Results List
            React.createElement(ResultsList, {
                results: appState.scanResults,
                selectedItems: appState.selectedItems,
                focusedItem: appState.focusedItem,
                filterText: appState.filterText,
                onToggleSelection: handleToggleSelection,
                onFocusChange: handleFocusChange
            }),

            // Preview Pane
            React.createElement(PreviewPane, {
                focusedItem: appState.focusedItem,
                results: appState.scanResults,
                selectedItems: appState.selectedItems
            })
        ),

        // Action Bar (for multi-select operations)
        selectedCount > 0 && React.createElement('div',
            {
                style: {
                    padding: '0.5rem 1rem',
                    backgroundColor: '#e3f2fd',
                    borderTop: '1px solid #ccc',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }
            },
            React.createElement('span', null,
                `${selectedCount} items selected (${formatSize(selectedSize)})`
            ),
            React.createElement('div', null,
                React.createElement('button',
                    {
                        onClick: selectAll,
                        style: { marginRight: '0.5rem', padding: '0.25rem 0.5rem' }
                    },
                    'Select All'
                ),
                React.createElement('button',
                    {
                        onClick: clearSelection,
                        style: { marginRight: '0.5rem', padding: '0.25rem 0.5rem' }
                    },
                    'Clear Selection'
                ),
                React.createElement('button',
                    {
                        onClick: handleDeleteSelected,
                        style: {
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px'
                        }
                    },
                    'Delete Selected'
                )
            )
        ),

        // Demo buttons
        React.createElement('div',
            {
                style: {
                    padding: '0.5rem 1rem',
                    backgroundColor: '#f8f9fa',
                    borderTop: '1px solid #ccc',
                    display: 'flex',
                    gap: '0.5rem',
                    flexWrap: 'wrap'
                }
            },
            React.createElement('button',
                {
                    onClick: () => setIsSearchActive(!isSearchActive),
                    style: { padding: '0.25rem 0.5rem' }
                },
                isSearchActive ? 'Close Search' : 'Open Search'
            ),
            React.createElement('button',
                {
                    onClick: () => showModal('help'),
                    style: { padding: '0.25rem 0.5rem' }
                },
                'Show Help (?)'
            ),
            React.createElement('button',
                {
                    onClick: handleStartScan,
                    disabled: appState.isScanning,
                    style: { padding: '0.25rem 0.5rem' }
                },
                appState.isScanning ? 'Scanning...' : 'Start Scan'
            )
        ),

        // Status Bar
        React.createElement(StatusBar, {
            selectedCount: selectedCount,
            totalCount: appState.scanResults.length,
            isScanning: appState.isScanning,
            scanProgress: appState.scanProgress
        }),

        // Modals
        appState.showModal && appState.modalType === 'confirm' && React.createElement(ConfirmationModal, {
            title: 'Confirm Deletion',
            message: `Are you sure you want to delete ${selectedCount} selected items? They will be moved to trash/quarantine for safety.`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            onConfirm: handleConfirmDelete,
            onCancel: hideModal,
            isDestructive: true
        }),

        appState.showModal && appState.modalType === 'help' && React.createElement(HelpModal, {
            keyHandlers: keyHandlers,
            onClose: hideModal,
            devMode: appState.devMode
        }),

        appState.isScanning && React.createElement(ProgressModal, {
            title: 'Scanning for cleanup targets...',
            progress: appState.scanProgress,
            message: 'Analyzing directories and files',
            isIndeterminate: false,
            onCancel: () => setScanning(false, 0),
            cancelText: 'Cancel Scan'
        }),

        appState.isDeleting && React.createElement(ProgressModal, {
            title: 'Deleting selected items...',
            progress: appState.deleteProgress,
            message: 'Moving items to trash/quarantine',
            isIndeterminate: false
        })
    );
};

export default CompleteApp;