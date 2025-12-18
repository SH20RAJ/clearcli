import React from 'react';
import { ScanResult } from '../types';
import { fuzzyFilter, highlightMatches, FuzzyMatch } from '../utils/fuzzySearch';

interface ResultsListProps {
    results: Array<ScanResult & { fuzzyMatch?: { score: number; matches: number[] } }>;
    selectedItems: Set<string>;
    focusedItem: string | null;
    filterText?: string;
    onToggleSelection: (path: string) => void;
    onFocusChange: (path: string) => void;
}

export const ResultsList: React.FC<ResultsListProps> = ({
    results,
    selectedItems,
    focusedItem,
    filterText = '',
    onToggleSelection,
    onFocusChange
}) => {
    // Results are already filtered and have fuzzyMatch data
    const filteredResults = results;

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

    const formatPath = (path: string, maxLength: number = 50): string => {
        if (path.length <= maxLength) return path;
        return '...' + path.slice(-(maxLength - 3));
    };

    const renderHighlightedPath = (path: string, matches: number[]): React.ReactElement => {
        if (matches.length === 0) {
            return React.createElement('span', null, formatPath(path));
        }

        const formattedPath = formatPath(path);
        const parts: React.ReactElement[] = [];
        let lastIndex = 0;

        // Adjust match indices for formatted path
        const pathOffset = path.length - formattedPath.length;
        const adjustedMatches = matches
            .map(index => index - pathOffset)
            .filter(index => index >= 0 && index < formattedPath.length);

        adjustedMatches.forEach((matchIndex, i) => {
            // Add text before match
            if (matchIndex > lastIndex) {
                parts.push(
                    React.createElement('span', { key: `text-${i}` },
                        formattedPath.slice(lastIndex, matchIndex)
                    )
                );
            }

            // Add highlighted character
            parts.push(
                React.createElement('mark',
                    {
                        key: `match-${i}`,
                        style: { backgroundColor: '#ffeb3b', padding: 0 }
                    },
                    formattedPath[matchIndex]
                )
            );

            lastIndex = matchIndex + 1;
        });

        // Add remaining text
        if (lastIndex < formattedPath.length) {
            parts.push(
                React.createElement('span', { key: 'text-end' },
                    formattedPath.slice(lastIndex)
                )
            );
        }

        return React.createElement('span', null, ...parts);
    };

    if (filteredResults.length === 0) {
        const message = filterText
            ? `No results match "${filterText}"`
            : 'No results found. Run a scan to see cleanup targets.';

        return React.createElement('div',
            {
                style: {
                    padding: '1rem',
                    border: '1px solid #ccc',
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }
            },
            message
        );
    }

    const listItems = filteredResults.map((result, index) => {
        const isSelected = selectedItems.has(result.path);
        const isFocused = focusedItem === result.path;

        const itemStyle = {
            padding: '0.25rem 0.5rem',
            cursor: 'pointer',
            backgroundColor: isFocused ? (isSelected ? '#d4edda' : '#e6f3ff') : (isSelected ? '#f0f8ff' : 'transparent'),
            borderLeft: isFocused ? '4px solid #007acc' : (isSelected ? '4px solid #28a745' : '4px solid transparent'),
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            transition: 'all 0.15s ease',
            border: isFocused ? '1px solid #007acc' : '1px solid transparent',
            borderRadius: '2px',
            margin: '1px 0'
        };

        // Enhanced visual indicators with better contrast
        const getSelectionIcon = () => {
            if (isSelected && isFocused) return '◉'; // Selected and focused - filled circle
            if (isSelected) return '●'; // Selected - filled dot
            if (isFocused) return '○'; // Focused but not selected - empty circle
            return '·'; // Neither - small dot
        };

        const getSelectionColor = () => {
            if (isSelected && isFocused) return '#007acc'; // Blue for selected and focused
            if (isSelected) return '#28a745'; // Green for selected
            if (isFocused) return '#007acc'; // Blue for focused
            return '#999'; // Gray for neither
        };

        const typeIcon = result.type === 'directory' ? '📁' : '📄';

        return React.createElement('div',
            {
                key: result.path,
                style: itemStyle,
                onClick: () => {
                    onFocusChange(result.path);
                    onToggleSelection(result.path);
                }
            },
            React.createElement('div',
                { style: { display: 'flex', alignItems: 'center', flex: 1 } },
                React.createElement('span', {
                    style: {
                        marginRight: '0.5rem',
                        fontSize: '1rem',
                        color: getSelectionColor(),
                        fontWeight: 'bold'
                    }
                }, getSelectionIcon()),
                React.createElement('span', { style: { marginRight: '0.5rem' } }, typeIcon),
                React.createElement('div', { style: { flex: 1 } },
                    renderHighlightedPath(result.path, result.fuzzyMatch?.matches || [])
                )
            ),
            React.createElement('div',
                { style: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' } },
                React.createElement('span',
                    { style: { fontSize: '0.8rem', color: '#666' } },
                    formatSize(result.size)
                ),
                filterText && result.fuzzyMatch && React.createElement('span',
                    { style: { fontSize: '0.7rem', color: '#999' } },
                    `${Math.round(result.fuzzyMatch.score * 100)}%`
                )
            )
        );
    });

    const headerText = filterText
        ? `Filtered Results (${filteredResults.length} of ${results.length})`
        : `Results (${filteredResults.length} items)`;

    return React.createElement('div',
        {
            style: {
                border: '1px solid #ccc',
                flex: 1,
                overflow: 'auto',
                maxHeight: '100%',
                display: 'flex',
                flexDirection: 'column'
            }
        },
        React.createElement('div',
            {
                style: {
                    padding: '0.5rem',
                    borderBottom: '1px solid #eee',
                    fontWeight: 'bold',
                    backgroundColor: '#f8f9fa',
                    position: 'sticky',
                    top: 0
                }
            },
            headerText
        ),
        React.createElement('div',
            { style: { flex: 1 } },
            ...listItems
        )
    );
};

export default ResultsList;