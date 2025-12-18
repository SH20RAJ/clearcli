import React from 'react';

interface StatusBarProps {
    selectedCount: number;
    totalCount: number;
    filteredCount?: number;
    isScanning: boolean;
    scanProgress?: number;
    filterText?: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({
    selectedCount,
    totalCount,
    filteredCount,
    isScanning,
    scanProgress = 0,
    filterText = ''
}) => {
    let statusText = '';

    if (isScanning) {
        statusText = `Scanning... ${Math.round(scanProgress * 100)}%`;
    } else {
        const displayCount = filteredCount !== undefined ? filteredCount : totalCount;
        const filterInfo = filterText && filteredCount !== undefined && filteredCount !== totalCount
            ? ` (filtered from ${totalCount})`
            : '';
        statusText = `${selectedCount} selected of ${displayCount} items${filterInfo}`;
    }

    const helpText = filterText
        ? 'Ctrl+L to clear filter | ? for help | q to quit'
        : 'Press / to search | ? for help | q to quit';

    return React.createElement('div',
        {
            style: {
                padding: '0 1rem',
                borderTop: '1px solid #ccc',
                height: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#f8f9fa'
            }
        },
        React.createElement('span', null, statusText),
        React.createElement('span', { style: { color: '#666' } }, helpText)
    );
};

export default StatusBar;