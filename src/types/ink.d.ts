declare module 'ink' {
    import { ReactNode } from 'react';

    export interface BoxProps {
        children?: ReactNode;
        flexDirection?: 'row' | 'column';
        flex?: number;
        justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
        alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
        paddingX?: number;
        paddingY?: number;
        borderStyle?: 'single' | 'double' | 'round' | 'bold' | 'singleDouble' | 'doubleSingle' | 'classic';
        height?: string | number;
        width?: string | number;
        position?: 'absolute' | 'relative';
        top?: number;
        left?: number;
    }

    export interface TextProps {
        children?: ReactNode;
        color?: string;
        backgroundColor?: string;
        bold?: boolean;
        dimColor?: boolean;
    }

    export const Box: React.FC<BoxProps>;
    export const Text: React.FC<TextProps>;

    export function render(element: ReactNode): void;
    export function useInput(handler: (input: string, key: any) => void): void;
    export function useApp(): { exit(): void };
}