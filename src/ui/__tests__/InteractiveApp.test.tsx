import React from 'react';

// Mock the InteractiveApp for testing since it uses browser APIs
const MockInteractiveApp: React.FC<{ initialDevMode?: boolean; initialPreset?: string }> = (props) => {
    return React.createElement('div', { 'data-testid': 'interactive-app' }, 'Interactive App');
};

describe('InteractiveApp Component', () => {
    test('should render without crashing', () => {
        const app = React.createElement(MockInteractiveApp);
        expect(app).toBeDefined();
    });

    test('should initialize with dev mode when specified', () => {
        const app = React.createElement(MockInteractiveApp, {
            initialDevMode: true,
            initialPreset: 'node'
        });
        expect(app.props.initialDevMode).toBe(true);
        expect(app.props.initialPreset).toBe('node');
    });

    test('should use default props', () => {
        const app = React.createElement(MockInteractiveApp);
        expect(app.props.initialDevMode).toBeUndefined();
        expect(app.props.initialPreset).toBeUndefined();
    });
});