import { KeyHandler } from '../types';

interface UseKeyboardHandlerOptions {
    onMoveFocus: (direction: 'up' | 'down') => void;
    onToggleSelection: () => void;
    onSelectAll: () => void;
    onClearSelection: () => void;
    onShowHelp: () => void;
    onHideModal: () => void;
    onSetView: (view: 'scan' | 'bigfiles' | 'quarantine') => void;
    onFilterChange: (text: string) => void;
    focusedItem: string | null;
    filteredResults: any[];
}

export const useKeyboardHandler = (options: UseKeyboardHandlerOptions) => {
    const {
        onMoveFocus,
        onToggleSelection,
        onSelectAll,
        onClearSelection,
        onShowHelp,
        onHideModal,
        onSetView,
        onFilterChange,
        focusedItem,
        filteredResults
    } = options;

    // Define all keyboard shortcuts
    const keyHandlers: KeyHandler[] = [
        {
            key: 'q',
            handler: () => {
                // Exit will be handled by the main app
                console.log('Quit requested');
            },
            description: 'Quit application'
        },
        {
            key: 'j',
            handler: () => onMoveFocus('down'),
            description: 'Move focus down'
        },
        {
            key: 'k',
            handler: () => onMoveFocus('up'),
            description: 'Move focus up'
        },
        {
            key: 'space',
            handler: () => {
                if (focusedItem) {
                    onToggleSelection();
                }
            },
            description: 'Toggle selection'
        },
        {
            key: 'a',
            handler: onSelectAll,
            description: 'Select all items'
        },
        {
            key: 'ctrl+a',
            handler: onSelectAll,
            description: 'Select all items (Ctrl+A)'
        },
        {
            key: 'c',
            handler: onClearSelection,
            description: 'Clear selection'
        },
        {
            key: '?',
            handler: onShowHelp,
            description: 'Show help'
        },
        {
            key: 'escape',
            handler: onHideModal,
            description: 'Close modal'
        },
        {
            key: 's',
            handler: () => onSetView('scan'),
            description: 'Switch to scan view'
        },
        {
            key: 'b',
            handler: () => onSetView('bigfiles'),
            description: 'Switch to big files view'
        },
        {
            key: 'r',
            handler: () => onSetView('quarantine'),
            description: 'Switch to quarantine view'
        },
        {
            key: '/',
            handler: () => {
                // Focus search input - this will be handled by the search component
                console.log('Focus search');
            },
            description: 'Focus search filter'
        },
        {
            key: 'ctrl+f',
            handler: () => {
                // Focus search input - this will be handled by the search component
                console.log('Focus search');
            },
            description: 'Focus search filter (Ctrl+F)'
        },
        {
            key: 'ctrl+l',
            handler: () => onFilterChange(''),
            description: 'Clear search filter'
        }
    ];

    // Note: Actual input handling will be set up in the main app where Ink is available
    // This hook just provides the key handler definitions

    return { keyHandlers };
};