import React, { useEffect } from 'react';
import { useAppState } from './hooks/useAppState';
import { useKeyboardHandler } from './hooks/useKeyboardHandler';
import { Header } from './components/Header';
import { StatusBar } from './components/StatusBar';
import { ResultsList } from './components/ResultsList';
import { PreviewPane } from './components/PreviewPane';
import { SearchFilter } from './components/SearchFilter';

interface AppProps {
    initialDevMode?: boolean;
    initialPreset?: string;
}

export const App: React.FC<AppProps> = ({
    initialDevMode = false,
    initialPreset = undefined
}) => {
    // Use custom hooks for state management
    const {
        appState,
        filteredResults,
        selectedCount,
        toggleSelection,
        selectAll,
        clearSelection,
        setCurrentView,
        showModal,
        hideModal,
        moveFocus,
        setFocusedItem,
        setFilterText
    } = useAppState({ initialDevMode, initialPreset });

    // Set up keyboard handling
    const { keyHandlers } = useKeyboardHandler({
        onMoveFocus: moveFocus,
        onToggleSelection: () => {
            if (appState.focusedItem) {
                toggleSelection(appState.focusedItem);
            }
        },
        onSelectAll: selectAll,
        onClearSelection: clearSelection,
        onShowHelp: () => showModal('help'),
        onHideModal: hideModal,
        onSetView: setCurrentView,
        onFilterChange: setFilterText,
        focusedItem: appState.focusedItem,
        filteredResults: filteredResults
    });

    // Initialize focus on first filtered result
    useEffect(() => {
        if (filteredResults.length > 0 && !appState.focusedItem) {
            setFocusedItem(filteredResults[0].path);
        } else if (filteredResults.length > 0 && appState.focusedItem) {
            // Check if focused item is still in filtered results
            const focusedStillVisible = filteredResults.some(r => r.path === appState.focusedItem);
            if (!focusedStillVisible) {
                setFocusedItem(filteredResults[0].path);
            }
        } else if (filteredResults.length === 0 && appState.filterText) {
            // Clear focus if no results match filter
            setFocusedItem(null);
        }
    }, [filteredResults, appState.focusedItem, appState.filterText, setFocusedItem]);

    // Add some mock data for testing the two-pane layout
    useEffect(() => {
        if (appState.scanResults.length === 0) {
            const mockResults = [
                {
                    path: '/Users/test/project/node_modules',
                    size: 150000000,
                    type: 'directory' as const,
                    lastModified: new Date('2024-01-15'),
                    preset: 'node',
                    project: 'my-app'
                },
                {
                    path: '/Users/test/project/.next',
                    size: 50000000,
                    type: 'directory' as const,
                    lastModified: new Date('2024-01-14'),
                    preset: 'node'
                },
                {
                    path: '/Users/test/Downloads/large-file.zip',
                    size: 200000000,
                    type: 'file' as const,
                    lastModified: new Date('2024-01-10')
                },
                {
                    path: '/Users/test/project/dist',
                    size: 25000000,
                    type: 'directory' as const,
                    lastModified: new Date('2024-01-12'),
                    preset: 'node'
                },
                {
                    path: '/Users/test/.cache/pip',
                    size: 75000000,
                    type: 'directory' as const,
                    lastModified: new Date('2024-01-08'),
                    preset: 'python'
                }
            ];

            // Set mock data using the state management hook
            // Note: This would normally be done through a scan operation
            // For now, we'll just simulate having scan results
            // This is temporary mock data for testing the UI
            const mockState = {
                scanResults: mockResults,
                isScanning: false,
                scanProgress: 0,
                selectedItems: new Set<string>(),
                focusedItem: null,
                currentView: 'scan' as const,
                showModal: false,
                modalType: null,
                filterText: '',
                activePreset: initialPreset,
                devMode: initialDevMode,
                isDeleting: false,
                deleteProgress: 0,
                lastOperation: null
            };

            // Update the app state with mock data
            Object.assign(appState, mockState);
        }
    }, [appState.scanResults.length]);

    return React.createElement('div',
        {
            style: {
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: 'monospace'
            }
        },
        // Header component
        React.createElement(Header, {
            currentView: appState.currentView,
            devMode: appState.devMode,
            activePreset: appState.activePreset
        }),

        // Main content area - Two-pane layout
        React.createElement('div',
            {
                style: {
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'row',
                    overflow: 'hidden'
                }
            },
            // Left pane - Search and Results
            React.createElement('div',
                {
                    style: {
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }
                },
                // Search Filter
                React.createElement(SearchFilter, {
                    filterText: appState.filterText,
                    onFilterChange: setFilterText,
                    placeholder: 'Type to filter results... (fuzzy search)',
                    isActive: appState.filterText.length > 0
                }),

                // Results List
                React.createElement(ResultsList, {
                    results: filteredResults,
                    selectedItems: appState.selectedItems,
                    focusedItem: appState.focusedItem,
                    filterText: appState.filterText,
                    onToggleSelection: toggleSelection,
                    onFocusChange: setFocusedItem
                })
            ),

            // Preview Pane
            React.createElement(PreviewPane, {
                focusedItem: appState.focusedItem,
                results: filteredResults,
                selectedItems: appState.selectedItems
            })
        ),

        // Status Bar
        React.createElement(StatusBar, {
            selectedCount: selectedCount,
            totalCount: appState.scanResults.length,
            filteredCount: filteredResults.length,
            isScanning: appState.isScanning,
            scanProgress: appState.scanProgress,
            filterText: appState.filterText
        }),

        // TODO: Modal components will be implemented in task 4.4
        appState.showModal && React.createElement('div',
            {
                style: {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }
            },
            React.createElement('div',
                {
                    style: {
                        backgroundColor: 'white',
                        padding: '2rem',
                        borderRadius: '8px',
                        border: '1px solid #ccc'
                    }
                },
                `Modal: ${appState.modalType}`
            )
        )
    );
};

export default App;