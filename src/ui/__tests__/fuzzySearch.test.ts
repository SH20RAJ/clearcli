import { fuzzyMatch, fuzzyFilter, highlightMatches } from '../utils/fuzzySearch';

describe('Fuzzy Search', () => {
    describe('fuzzyMatch', () => {
        test('should match exact strings', () => {
            const result = fuzzyMatch('hello', 'hello');
            expect(result).not.toBeNull();
            expect(result!.score).toBeGreaterThan(0.8);
        });

        test('should match partial strings', () => {
            const result = fuzzyMatch('hello world', 'hlo');
            expect(result).not.toBeNull();
            expect(result!.matches).toEqual([0, 2, 4]); // h=0, l=2, o=4 in "hello world"
        });

        test('should be case insensitive by default', () => {
            const result = fuzzyMatch('Hello World', 'hlo');
            expect(result).not.toBeNull();
        });

        test('should respect case sensitivity option', () => {
            const result = fuzzyMatch('Hello World', 'hlo', { caseSensitive: true });
            expect(result).toBeNull();
        });

        test('should return null for non-matching patterns', () => {
            const result = fuzzyMatch('hello', 'xyz');
            expect(result).toBeNull();
        });

        test('should handle empty pattern', () => {
            const result = fuzzyMatch('hello', '');
            expect(result).not.toBeNull();
            expect(result!.score).toBe(1);
            expect(result!.matches).toEqual([]);
        });
    });

    describe('fuzzyFilter', () => {
        const testItems = [
            { path: '/Users/test/node_modules', name: 'node_modules' },
            { path: '/Users/test/.next', name: 'next' },
            { path: '/Users/test/package.json', name: 'package' }
        ];

        test('should filter and sort items by relevance', () => {
            const results = fuzzyFilter(testItems, 'node', item => item.path);
            expect(results.length).toBeGreaterThan(0);
            expect(results[0].path).toContain('node');
        });

        test('should return all items for empty pattern', () => {
            const results = fuzzyFilter(testItems, '', item => item.path);
            expect(results).toHaveLength(testItems.length);
        });

        test('should include fuzzy match information', () => {
            const results = fuzzyFilter(testItems, 'node', item => item.path);
            expect(results[0]).toHaveProperty('fuzzyMatch');
            expect(results[0].fuzzyMatch).toHaveProperty('score');
            expect(results[0].fuzzyMatch).toHaveProperty('matches');
        });
    });

    describe('highlightMatches', () => {
        test('should highlight matched characters', () => {
            const result = highlightMatches('hello world', [0, 2, 6]);
            expect(result).toContain('<mark>h</mark>');
            expect(result).toContain('<mark>l</mark>');
            expect(result).toContain('<mark>w</mark>');
        });

        test('should return original text for no matches', () => {
            const result = highlightMatches('hello world', []);
            expect(result).toBe('hello world');
        });

        test('should handle consecutive matches', () => {
            const result = highlightMatches('hello', [0, 1, 2]);
            expect(result).toContain('<mark>h</mark><mark>e</mark><mark>l</mark>');
        });
    });
});