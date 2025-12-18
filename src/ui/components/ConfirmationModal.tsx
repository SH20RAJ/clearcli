import React from 'react';

interface ConfirmationModalProps {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDestructive?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    isDestructive = false
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
                    maxWidth: '500px',
                    width: '90%',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                }
            },
            // Title
            React.createElement('h2',
                {
                    style: {
                        margin: '0 0 1rem 0',
                        fontSize: '1.25rem',
                        fontWeight: 'bold',
                        color: isDestructive ? '#dc3545' : '#333'
                    }
                },
                title
            ),

            // Message
            React.createElement('p',
                {
                    style: {
                        margin: '0 0 2rem 0',
                        lineHeight: '1.5',
                        color: '#666'
                    }
                },
                message
            ),

            // Buttons
            React.createElement('div',
                {
                    style: {
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '0.5rem'
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
                ),
                React.createElement('button',
                    {
                        onClick: onConfirm,
                        style: {
                            padding: '0.5rem 1rem',
                            border: 'none',
                            backgroundColor: isDestructive ? '#dc3545' : '#007acc',
                            color: 'white',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: 'bold'
                        }
                    },
                    confirmText
                )
            )
        )
    );
};

export default ConfirmationModal;