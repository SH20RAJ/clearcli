import React from 'react';
import { SimpleTerminalApp } from '../SimpleTerminalApp';

describe('SimpleTerminalApp Component', () => {
    test('should render without crashing', () => {
        const app = React.createElement(SimpleTerminalApp);
        expect(app).toBeDefined();
    });

    test('should initialize with dev mode when specified', () => {
        const app = React.createElement(SimpleTerminalApp, {
            initialDevMode: true,
            initialPreset: 'node'
        });
        expect(app.props.initialDevMode).toBe(true);
        expect(app.props.initialPreset).toBe('node');
    });

    test('should use default props', () => {
        const app = React.createElement(SimpleTerminalApp);
        expect(app.props.initialDevMode).toBeUndefined();
        expect(app.props.initialPreset).toBeUndefined();
    });
});