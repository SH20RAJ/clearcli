import React, { useRef, useEffect } from 'react';

interface SearchFilterProps {
    filterText: string;
    onFilterChange: (text: string) => void;
    placeholder?: string;
    isActive?: boolean;
    autoFocus?: boolean;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({
    filterText,
    onFilterChange,
    placeholder = 'Type to filter results...',
    isActive = false,
    autoFocus = false
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onFilterChange((event.target as HTMLInputElement).value);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        // Allow Escape to clear the filter
        if (event.key === 'Escape') {
            onFilterChange('');
            if (inputRef.current) {
                inputRef.current.blur();
            }
        }
    };

    useEffect(() => {
        if (autoFocus && inputRef.current) {
            inputRef.current.focus();
        }
    }, [autoFocus]);

    return React.createElement('div',
        {
            style: {
                padding: '0.5rem',
                borderBottom: '1px solid #eee',
                backgroundColor: isActive ? '#f8f9fa' : 'transparent'
            }
        },
        React.createElement('div',
            { style: { position: 'relative' } },
            React.createElement('input', {
                ref: inputRef,
                type: 'text',
                value: filterText,
                onChange: handleInputChange,
                onKeyDown: handleKeyDown,
                placeholder: placeholder,
                style: {
                    width: '100%',
                    padding: '0.25rem 2rem 0.25rem 0.5rem',
                    border: isActive ? '2px solid #007acc' : '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    outline: 'none',
                    backgroundColor: isActive ? '#f8f9fa' : 'white'
                }
            }),
            // Search icon
            React.createElement('span',
                {
                    style: {
                        position: 'absolute',
                        right: '0.5rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#666',
                        fontSize: '0.8rem'
                    }
                },
                filterText ? '✕' : '🔍'
            ),
            // Clear button when there's text
            filterText && React.createElement('button',
                {
                    onClick: () => onFilterChange(''),
                    style: {
                        position: 'absolute',
                        right: '0.25rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#666',
                        fontSize: '0.8rem',
                        padding: '0.25rem'
                    }
                },
                '✕'
            )
        )
    );
};

export default SearchFilter;