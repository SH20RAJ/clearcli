import React from 'react';
import { ScanResult } from '../types';

interface PreviewPaneProps {
    focusedItem: string | null;
    results: ScanResult[];
    selectedItems: Set<string>;
}

export const PreviewPane: React.FC<PreviewPaneProps> = ({
    focusedItem,
    results,
    selectedItems
}) => {
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

    const formatDate = (date: Date): string => {
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    const focusedResult = focusedItem ? results.find(r => r.path === focusedItem) : null;

    if (!focusedResult) {
        const selectedCount = selectedItems.size;
        const totalSelectedSize = results
            .filter(r => selectedItems.has(r.path))
            .reduce((sum, r) => sum + r.size, 0);

        return React.createElement('div',
            {
                style: {
                    border: '1px solid #ccc',
                    flex: 1,
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                }
            },
            React.createElement('div',
                { style: { textAlign: 'center' } },
                React.createElement('h3', null, 'Selection Summary'),
                React.createElement('p', null, `${selectedCount} items selected`),
                selectedCount > 0 && React.createElement('p', null, `Total size: ${formatSize(totalSelectedSize)}`),
                React.createElement('p',
                    { style: { fontSize: '0.9rem', color: '#666', marginTop: '1rem' } },
                    'Use ↑↓ or j/k to navigate, Space to select, Enter to preview'
                )
            )
        );
    }

    const isSelected = selectedItems.has(focusedResult.path);

    return React.createElement('div',
        {
            style: {
                border: '1px solid #ccc',
                flex: 1,
                display: 'flex',
                flexDirection: 'column'
            }
        },
        React.createElement('div',
            { style: { padding: '0.5rem', borderBottom: '1px solid #eee', fontWeight: 'bold' } },
            'Preview'
        ),
        React.createElement('div',
            { style: { padding: '1rem', flex: 1, overflow: 'auto' } },
            React.createElement('div',
                { style: { marginBottom: '1rem' } },
                React.createElement('div',
                    { style: { display: 'flex', alignItems: 'center', marginBottom: '0.5rem' } },
                    React.createElement('span', { style: { marginRight: '0.5rem' } },
                        focusedResult.type === 'directory' ? '📁' : '📄'
                    ),
                    React.createElement('span', { style: { fontWeight: 'bold' } },
                        isSelected ? '☑ Selected' : '☐ Not Selected'
                    )
                )
            ),
            React.createElement('div',
                { style: { marginBottom: '1rem' } },
                React.createElement('h4', null, 'Details'),
                React.createElement('p', null, `Path: ${focusedResult.path}`),
                React.createElement('p', null, `Type: ${focusedResult.type}`),
                React.createElement('p', null, `Size: ${formatSize(focusedResult.size)}`),
                React.createElement('p', null, `Modified: ${formatDate(focusedResult.lastModified)}`),
                focusedResult.preset && React.createElement('p', null, `Preset: ${focusedResult.preset}`),
                focusedResult.project && React.createElement('p', null, `Project: ${focusedResult.project}`)
            ),
            React.createElement('div',
                { style: { marginTop: '2rem', fontSize: '0.9rem', color: '#666' } },
                React.createElement('h4', null, 'Actions'),
                React.createElement('p', null, 'Space - Toggle selection'),
                React.createElement('p', null, 'Enter - Open/expand (if directory)'),
                React.createElement('p', null, 'Delete - Move to trash/quarantine')
            )
        )
    );
};

export default PreviewPane;