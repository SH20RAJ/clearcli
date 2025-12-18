import React from 'react';
import { CompleteApp } from '../CompleteApp';

describe('CompleteApp Component', () => {
    test('should render without crashing', () => {
        const app = React.createElement(CompleteApp);
        expect(app).toBeDefined();
    });

    test('should initialize with dev mode when specified', () => {
        const app = React.createElement(CompleteApp, {
            initialDevMode: true,
            initialPreset: 'node'
        });
        expect(app.props.initialDevMode).toBe(true);
        expect(app.props.initialPreset).toBe('node');
    });

    test('should use default props', () => {
        const app = React.createElement(CompleteApp);
        expect(app.props.initialDevMode).toBeUndefined();
        expect(app.props.initialPreset).toBeUndefined();
    });
});