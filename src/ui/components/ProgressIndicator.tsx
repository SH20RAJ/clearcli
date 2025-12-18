import React from 'react';

interface ProgressIndicatorProps {
    progress: number; // 0-1
    message: string;
    isIndeterminate?: boolean;
    showPercentage?: boolean;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
    progress,
    message,
    isIndeterminate = false,
    showPercentage = true
}) => {
    const percentage = Math.round(progress * 100);

    return React.createElement('div',
        {
            style: {
                padding: '1rem',
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                margin: '0.5rem 0'
            }
        },
        // Message
        React.createElement('div',
            {
                style: {
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem',
                    color: '#333'
                }
            },
            message,
            showPercentage && !isIndeterminate && React.createElement('span',
                { style: { float: 'right', color: '#666' } },
                `${percentage}%`
            )
        ),

        // Progress bar
        React.createElement('div',
            {
                style: {
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#e9ecef',
                    borderRadius: '4px',
                    overflow: 'hidden'
                }
            },
            React.createElement('div',
                {
                    style: {
                        height: '100%',
                        backgroundColor: '#007acc',
                        width: isIndeterminate ? '100%' : `${percentage}%`,
                        transition: isIndeterminate ? 'none' : 'width 0.3s ease',
                        animation: isIndeterminate ? 'pulse 1.5s ease-in-out infinite' : 'none'
                    }
                }
            )
        )
    );
};

interface ProgressModalProps {
    title: string;
    progress: number;
    message: string;
    isIndeterminate?: boolean;
    onCancel?: () => void;
    cancelText?: string;
}

export const ProgressModal: React.FC<ProgressModalProps> = ({
    title,
    progress,
    message,
    isIndeterminate = false,
    onCancel,
    cancelText = 'Cancel'
}) => {
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
                    minWidth: '400px',
                    maxWidth: '500px',
                    width: '90%',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                }
            },
            // Title
            React.createElement('h3',
                {
                    style: {
                        margin: '0 0 1rem 0',
                        fontSize: '1.25rem',
                        fontWeight: 'bold',
                        color: '#333'
                    }
                },
                title
            ),

            // Progress indicator
            React.createElement(ProgressIndicator, {
                progress,
                message,
                isIndeterminate,
                showPercentage: true
            }),

            // Cancel button (if provided)
            onCancel && React.createElement('div',
                {
                    style: {
                        marginTop: '1.5rem',
                        textAlign: 'right'
                    }
                },
                React.createElement('button',
                    {
                        onClick: onCancel,
                        style: {
                            padding: '0.5rem 1rem',
                            border: '1px solid #ccc',
                            backgroundColor: 'white',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                        }
                    },
                    cancelText
                )
            )
        )
    );
};

export default ProgressIndicator;