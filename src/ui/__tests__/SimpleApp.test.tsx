import React from 'react';
import { SimpleApp } from '../SimpleApp';

describe('SimpleApp Component', () => {
    test('should create component without crashing', () => {
        const component = React.createElement(SimpleApp, { message: 'Test' });
        expect(component).toBeDefined();
        expect(component.props.message).toBe('Test');
    });

    test('should use default message', () => {
        const component = React.createElement(SimpleApp);
        expect(component).toBeDefined();
    });
});