import React, { useEffect } from 'react';
import { useAppState } from './hooks/useAppState';
import { Header, StatusBar, ResultsList, PreviewPane } from './components';

interface SimpleTerminalAppProps {
    initialDevMode?: boolean;
    initialPreset?: string;
}

export const SimpleTerminalApp: React.FC<SimpleTerminalAppProps> = ({
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
        setFocusedItem
    } = useAppState({ initialDevMode, initialPreset });

    // Initialize focus on first scan result
    useEffect(() => {
        if (appState.scanResults.length > 0 && !appState.focusedItem) {
            setFocusedItem(appState.scanResults[0].path);
        }
    }, [appState.scanResults, appState.focusedItem, setFocusedItem]);

    // Mock some sample data for demonstration
    useEffect(() => {
        // This would normally come from the scanner
        const mockResults = [
            {
                path: '/Users/test/node_modules',
                size: 150000000,
                type: 'directory' as const,
                lastModified: new Date('2024-01-15'),
                preset: 'node',
                project: 'my-app'
            },
            {
                path: '/Users/test/.next',
                size: 50000000,
                type: 'directory' as const,
                lastModified: new Date('2024-01-14'),
                preset: 'node'
            },
            {
                path: '/Users/test/large-file.zip',
                size: 200000000,
                type: 'file' as const,
                lastModified: new Date('2024-01-10')
            }
        ];

        // Only set mock data if we don't have any results yet
        if (appState.scanResults.length === 0) {
            // We would call setScanResults here, but for now just simulate having data
            // setScanResults(mockResults);
        }
    }, [appState.scanResults.length]);

    const handleToggleSelection = (path: string) => {
        toggleSelection(path);
    };

    const handleFocusChange = (path: string) => {
        setFocusedItem(path);
    };

    return React.createElement('div',
        {
            style: {
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: 'monospace'
            }
        },
        // Header
        React.createElement(Header, {
            currentView: appState.currentView,
            devMode: appState.devMode,
            activePreset: appState.activePreset
        }),

        // Main content area
        React.createElement('div',
            {
                style: {
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'row',
                    overflow: 'hidden'
                }
            },
            // Results List
            React.createElement(ResultsList, {
                results: appState.scanResults,
                selectedItems: appState.selectedItems,
                focusedItem: appState.focusedItem,
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

        // Status Bar
        React.createElement(StatusBar, {
            selectedCount: selectedCount,
            totalCount: appState.scanResults.length,
            isScanning: appState.isScanning,
            scanProgress: appState.scanProgress
        }),

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
                    justifyContent: 'center'
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

export default SimpleTerminalApp;