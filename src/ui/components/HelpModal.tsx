import React from 'react';
import { KeyHandler } from '../types';

interface HelpModalProps {
    keyHandlers: KeyHandler[];
    onClose: () => void;
    devMode?: boolean;
}

export const HelpModal: React.FC<HelpModalProps> = ({
    keyHandlers,
    onClose,
    devMode = false
}) => {
    const basicShortcuts = keyHandlers.filter(handler =>
        ['q', 'j', 'k', 'space', 'a', 'c', '?', 'escape'].includes(handler.key)
    );

    const viewShortcuts = keyHandlers.filter(handler =>
        ['s', 'b', 'r'].includes(handler.key)
    );

    const devShortcuts = devMode ? keyHandlers.filter(handler =>
        ['g', 'p', 'd'].includes(handler.key)
    ) : [];

    const renderShortcutGroup = (title: string, shortcuts: KeyHandler[]) => {
        if (shortcuts.length === 0) return null;

        return React.createElement('div',
            { style: { marginBottom: '1.5rem' } },
            React.createElement('h4',
                {
                    style: {
                        margin: '0 0 0.5rem 0',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        color: '#333'
                    }
                },
                title
            ),
            React.createElement('div',
                { style: { display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.25rem' } },
                ...shortcuts.flatMap(handler => [
                    React.createElement('kbd',
                        {
                            key: `key-${handler.key}`,
                            style: {
                                padding: '0.125rem 0.25rem',
                                backgroundColor: '#f8f9fa',
                                border: '1px solid #dee2e6',
                                borderRadius: '3px',
                                fontSize: '0.8rem',
                                fontFamily: 'monospace'
                            }
                        },
                        handler.key === 'space' ? 'Space' : handler.key.toUpperCase()
                    ),
                    React.createElement('span',
                        {
                            key: `desc-${handler.key}`,
                            style: { fontSize: '0.9rem', color: '#666' }
                        },
                        handler.description
                    )
                ])
            )
        );
    };

    return React.createElement('div',
        {
            style: {
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
                    borderRadius: '8px',
                    padding: '2rem',
                    maxWidth: '600px',
                    width: '90%',
                    maxHeight: '80vh',
                    overflow: 'auto',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                }
            },
            // Header
            React.createElement('div',
                {
                    style: {
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1.5rem'
                    }
                },
                React.createElement('h2',
                    {
                        style: {
                            margin: 0,
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: '#333'
                        }
                    },
                    `cleancli Help${devMode ? ' (Developer Mode)' : ''}`
                ),
                React.createElement('button',
                    {
                        onClick: onClose,
                        style: {
                            background: 'none',
                            border: 'none',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            color: '#666'
                        }
                    },
                    '×'
                )
            ),

            // Introduction
            React.createElement('p',
                {
                    style: {
                        margin: '0 0 1.5rem 0',
                        color: '#666',
                        lineHeight: '1.5'
                    }
                },
                'cleancli is a fast, safe cleanup tool for developers. Use keyboard shortcuts to navigate and manage your cleanup operations efficiently.'
            ),

            // Shortcut groups
            renderShortcutGroup('Navigation & Selection', basicShortcuts),
            renderShortcutGroup('View Switching', viewShortcuts),
            devMode && renderShortcutGroup('Developer Shortcuts', devShortcuts),

            // Additional help
            React.createElement('div',
                { style: { marginTop: '2rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' } },
                React.createElement('h4',
                    { style: { margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 'bold' } },
                    'Tips'
                ),
                React.createElement('ul',
                    { style: { margin: 0, paddingLeft: '1.5rem', color: '#666' } },
                    React.createElement('li', null, 'Use fuzzy search (/) to quickly find specific files or directories'),
                    React.createElement('li', null, 'Selected items are moved to trash/quarantine by default for safety'),
                    React.createElement('li', null, 'Press Escape to close any modal or cancel current operation'),
                    devMode && React.createElement('li', null, 'Developer mode exposes additional presets and shortcuts')
                )
            ),

            // Footer
            React.createElement('div',
                {
                    style: {
                        marginTop: '2rem',
                        textAlign: 'center',
                        fontSize: '0.8rem',
                        color: '#999'
                    }
                },
                'Press ESC or click outside to close this help'
            )
        )
    );
};

export default HelpModal;