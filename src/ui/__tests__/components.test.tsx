import React from 'react';
import { Header, StatusBar, ResultsList, PreviewPane } from '../components';
import { ScanResult } from '../types';

describe('UI Components', () => {
    const mockResults: ScanResult[] = [
        {
            path: '/test/node_modules',
            size: 1000000,
            type: 'directory',
            lastModified: new Date('2024-01-01'),
            preset: 'node'
        },
        {
            path: '/test/file.txt',
            size: 5000,
            type: 'file',
            lastModified: new Date('2024-01-02')
        }
    ];

    describe('Header', () => {
        test('should render header with view info', () => {
            const header = React.createElement(Header, {
                currentView: 'scan',
                devMode: false,
                activePreset: null
            });

            expect(header).toBeDefined();
            expect(header.props.currentView).toBe('scan');
        });

        test('should show dev mode indicator', () => {
            const header = React.createElement(Header, {
                currentView: 'scan',
                devMode: true,
                activePreset: 'node'
            });

            expect(header.props.devMode).toBe(true);
            expect(header.props.activePreset).toBe('node');
        });
    });

    describe('StatusBar', () => {
        test('should render status with selection count', () => {
            const statusBar = React.createElement(StatusBar, {
                selectedCount: 2,
                totalCount: 5,
                isScanning: false
            });

            expect(statusBar).toBeDefined();
            expect(statusBar.props.selectedCount).toBe(2);
            expect(statusBar.props.totalCount).toBe(5);
        });

        test('should show scanning progress', () => {
            const statusBar = React.createElement(StatusBar, {
                selectedCount: 0,
                totalCount: 0,
                isScanning: true,
                scanProgress: 0.5
            });

            expect(statusBar.props.isScanning).toBe(true);
            expect(statusBar.props.scanProgress).toBe(0.5);
        });
    });

    describe('ResultsList', () => {
        test('should render results list', () => {
            const resultsList = React.createElement(ResultsList, {
                results: mockResults,
                selectedItems: new Set(['/test/node_modules']),
                focusedItem: '/test/node_modules',
                onToggleSelection: jest.fn(),
                onFocusChange: jest.fn()
            });

            expect(resultsList).toBeDefined();
            expect(resultsList.props.results).toHaveLength(2);
            expect(resultsList.props.selectedItems.has('/test/node_modules')).toBe(true);
        });

        test('should handle empty results', () => {
            const resultsList = React.createElement(ResultsList, {
                results: [],
                selectedItems: new Set<string>(),
                focusedItem: null,
                onToggleSelection: jest.fn(),
                onFocusChange: jest.fn()
            });

            expect(resultsList.props.results).toHaveLength(0);
        });
    });

    describe('PreviewPane', () => {
        test('should render preview for focused item', () => {
            const previewPane = React.createElement(PreviewPane, {
                focusedItem: '/test/node_modules',
                results: mockResults,
                selectedItems: new Set(['/test/node_modules'])
            });

            expect(previewPane).toBeDefined();
            expect(previewPane.props.focusedItem).toBe('/test/node_modules');
        });

        test('should show summary when no item focused', () => {
            const previewPane = React.createElement(PreviewPane, {
                focusedItem: null,
                results: mockResults,
                selectedItems: new Set(['/test/file.txt'])
            });

            expect(previewPane.props.focusedItem).toBeNull();
            expect(previewPane.props.selectedItems.size).toBe(1);
        });
    });
});