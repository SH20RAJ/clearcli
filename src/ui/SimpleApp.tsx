import React from 'react';

interface SimpleAppProps {
    message?: string;
}

export const SimpleApp: React.FC<SimpleAppProps> = ({ message = 'Hello World' }) => {
    return React.createElement('div', null, message);
};

export default SimpleApp;