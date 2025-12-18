import React, { useEffect, useState } from 'react';
import { useAppState } from './hooks/useAppState';
import { Header, StatusBar, ResultsList, PreviewPane, SearchFilter } from './components';
import { ScanResult } from './types';

interface InteractiveAppProps {
    initialDevMode?: boolean;
    initialPreset?: string;
}

export const InteractiveApp: React.FC<InteractiveAppProps> = ({
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
        setScanResults
    } = useAppState({ initialDevMode, initialPreset });

    const [isSearchActive, setIsSearchActive] = useState(false);

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
            },
            {
                path: '/Users/test/project/target',
                size: 100000000,
                type: 'directory',
                lastModified: new Date('2024-01-11'),
                preset: 'rust'
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

    // Keyboard shortcuts simulation (in a real terminal app, this would be handled by Ink)
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            switch (event.key) {
                case '/':
                    event.preventDefault();
                    setIsSearchActive(true);
                    break;
                case 'Escape':
                    if (isSearchActive) {
                        setIsSearchActive(false);
                        setFilterText('');
                    }
                    break;
                case 'a':
                    if (!isSearchActive) {
                        selectAll();
                    }
                    break;
                case 'c':
                    if (!isSearchActive) {
                        clearSelection();
                    }
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isSearchActive, selectAll, clearSelection, setFilterText]);

    const handleToggleSelection = (path: string) => {
        toggleSelection(path);
    };

    const handleFocusChange = (path: string) => {
        setFocusedItem(path);
    };

    const handleFilterChange = (text: string) => {
        setFilterText(text);
    };

    const handleMultiSelect = () => {
        // Select all visible (filtered) results
        const visiblePaths = appState.scanResults
            .filter(result =>
                !appState.filterText ||
                result.path.toLowerCase().includes(appState.filterText.toLowerCase())
            )
            .map(result => result.path);

        // Toggle selection for all visible items
        const allSelected = visiblePaths.every(path => appState.selectedItems.has(path));

        if (allSelected) {
            // Deselect all visible
            visiblePaths.forEach(path => {
                if (appState.selectedItems.has(path)) {
                    toggleSelection(path);
                }
            });
        } else {
            // Select all visible
            visiblePaths.forEach(path => {
                if (!appState.selectedItems.has(path)) {
                    toggleSelection(path);
                }
            });
        }
    };

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
            React.createElement('span', null, `${selectedCount} items selected`),
            React.createElement('div', null,
                React.createElement('button',
                    {
                        onClick: handleMultiSelect,
                        style: { marginRight: '0.5rem', padding: '0.25rem 0.5rem' }
                    },
                    'Select All Visible'
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
                        onClick: () => alert('Delete operation would happen here'),
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

        // Status Bar
        React.createElement(StatusBar, {
            selectedCount: selectedCount,
            totalCount: appState.scanResults.length,
            isScanning: appState.isScanning,
            scanProgress: appState.scanProgress
        }),

        // Help overlay
        React.createElement('div',
            {
                style: {
                    position: 'fixed',
                    bottom: '2rem',
                    right: '1rem',
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    color: 'white',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    maxWidth: '300px'
                }
            },
            React.createElement('div', null, 'Keyboard Shortcuts:'),
            React.createElement('div', null, '/ - Search/Filter'),
            React.createElement('div', null, 'a - Select All'),
            React.createElement('div', null, 'c - Clear Selection'),
            React.createElement('div', null, 'ESC - Close Search'),
            React.createElement('div', null, 'Click items to select/focus')
        ),

        // Modal placeholder (will be implemented in task 4.4)
        appState.showModal && React.createElement('div',
            {
                style: {
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }
            },
            React.createElement('div',
                {
                    style: {
                        backgroundColor: 'white',
                        padding: '2rem',
                        borderRadius: '8px',
                        maxWidth: '80%',
                        maxHeight: '80%'
                    }
                },
                `Modal: ${appState.modalType}`
            )
        )
    );
};

export default InteractiveApp;