import React from 'react';
import { ConfirmationModal, HelpModal, ProgressIndicator, ProgressModal } from '../components';

describe('Modal Components', () => {
    describe('ConfirmationModal', () => {
        test('should render confirmation modal', () => {
            const modal = React.createElement(ConfirmationModal, {
                title: 'Test Title',
                message: 'Test message',
                onConfirm: jest.fn(),
                onCancel: jest.fn()
            });

            expect(modal).toBeDefined();
            expect(modal.props.title).toBe('Test Title');
            expect(modal.props.message).toBe('Test message');
        });

        test('should handle destructive actions', () => {
            const modal = React.createElement(ConfirmationModal, {
                title: 'Delete Items',
                message: 'This will delete items',
                onConfirm: jest.fn(),
                onCancel: jest.fn(),
                isDestructive: true,
                confirmText: 'Delete',
                cancelText: 'Cancel'
            });

            expect(modal.props.isDestructive).toBe(true);
            expect(modal.props.confirmText).toBe('Delete');
            expect(modal.props.cancelText).toBe('Cancel');
        });
    });

    describe('HelpModal', () => {
        const mockKeyHandlers = [
            { key: 'q', handler: jest.fn(), description: 'Quit' },
            { key: 'j', handler: jest.fn(), description: 'Move down' }
        ];

        test('should render help modal', () => {
            const modal = React.createElement(HelpModal, {
                keyHandlers: mockKeyHandlers,
                onClose: jest.fn()
            });

            expect(modal).toBeDefined();
            expect(modal.props.keyHandlers).toHaveLength(2);
        });

        test('should show dev mode indicators', () => {
            const modal = React.createElement(HelpModal, {
                keyHandlers: mockKeyHandlers,
                onClose: jest.fn(),
                devMode: true
            });

            expect(modal.props.devMode).toBe(true);
        });
    });

    describe('ProgressIndicator', () => {
        test('should render progress indicator', () => {
            const indicator = React.createElement(ProgressIndicator, {
                progress: 0.5,
                message: 'Loading...'
            });

            expect(indicator).toBeDefined();
            expect(indicator.props.progress).toBe(0.5);
            expect(indicator.props.message).toBe('Loading...');
        });

        test('should handle indeterminate progress', () => {
            const indicator = React.createElement(ProgressIndicator, {
                progress: 0,
                message: 'Processing...',
                isIndeterminate: true,
                showPercentage: false
            });

            expect(indicator.props.isIndeterminate).toBe(true);
            expect(indicator.props.showPercentage).toBe(false);
        });
    });

    describe('ProgressModal', () => {
        test('should render progress modal', () => {
            const modal = React.createElement(ProgressModal, {
                title: 'Processing',
                progress: 0.75,
                message: 'Please wait...'
            });

            expect(modal).toBeDefined();
            expect(modal.props.title).toBe('Processing');
            expect(modal.props.progress).toBe(0.75);
        });

        test('should handle cancellation', () => {
            const onCancel = jest.fn();
            const modal = React.createElement(ProgressModal, {
                title: 'Processing',
                progress: 0.5,
                message: 'Please wait...',
                onCancel: onCancel,
                cancelText: 'Stop'
            });

            expect(modal.props.onCancel).toBe(onCancel);
            expect(modal.props.cancelText).toBe('Stop');
        });
    });
});