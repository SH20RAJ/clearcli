import React from 'react';

interface HeaderProps {
    currentView: string;
    devMode: boolean;
    activePreset?: string | null;
}

export const Header: React.FC<HeaderProps> = ({
    currentView,
    devMode,
    activePreset
}) => {
    const title = `cleancli${devMode ? ' [DEV]' : ''}`;
    const subtitle = activePreset ? ` - ${activePreset} preset` : '';
    const viewInfo = ` - ${currentView} view`;

    return React.createElement('div',
        {
            style: {
                padding: '0 1rem',
                borderBottom: '1px solid #ccc',
                height: '2rem',
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#f8f9fa',
                fontWeight: 'bold'
            }
        },
        `${title}${subtitle}${viewInfo}`
    );
};

export default Header;