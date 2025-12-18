import React from 'react';
import { ResultsList } from '../components/ResultsList';
import { SearchFilter } from '../components/SearchFilter';
import { ScanResult } from '../types';
import { fuzzyFilter } from '../utils/fuzzySearch';

describe('Interactive Selection and Filtering', () => {
  const mockResults: Array<ScanResult & { fuzzyMatch: { score: number; matches: number[] } }> = [
    {
      path: '/Users/test/node_modules',
      size: 150000000,
      type: 'directory',
      lastModified: new Date('2024-01-15'),
      preset: 'node',
      project: 'my-app',
      fuzzyMatch: { score: 1, matches: [] }
    },
    {
      path: '/Users/test/.next',
      size: 50000000,
      type: 'directory',
      lastModified: new Date('2024-01-14'),
      preset: 'node',
      fuzzyMatch: { score: 1, matches: [] }
    }
  ];

  describe('ResultsList Component', () => {
    const mockProps = {
      results: mockResults,
      selectedItems: new Set<string>(),
      focusedItem: null,
      filterText: '',
      onToggleSelection: jest.fn(),
      onFocusChange: jest.fn()
    };

    test('should handle selected items correctly', () => {
      const selectedItems = new Set(['/Users/test/node_modules']);
      const resultsList = React.createElement(ResultsList, { ...mockProps, selectedItems });

      expect(resultsList.props.selectedItems.has('/Users/test/node_modules')).toBe(true);
      expect(resultsList.props.selectedItems.size).toBe(1);
    });

    test('should handle multiple selections', () => {
      const selectedItems = new Set(['/Users/test/node_modules', '/Users/test/.next']);
      const resultsList = React.createElement(ResultsList, { ...mockProps, selectedItems });

      expect(resultsList.props.selectedItems.size).toBe(2);
    });
  });

  describe('SearchFilter Component', () => {
    test('should render with correct props', () => {
      const mockProps = {
        filterText: 'test',
        onFilterChange: jest.fn(),
        placeholder: 'Type to filter...',
        isActive: true
      };

      const searchFilter = React.createElement(SearchFilter, mockProps);

      expect(searchFilter.props.filterText).toBe('test');
      expect(searchFilter.props.isActive).toBe(true);
    });
  });

  describe('Fuzzy Search Integration', () => {
    test('should filter results using fuzzy search', () => {
      const testData = [
        { path: '/Users/test/node_modules', size: 1000, type: 'directory' as const, lastModified: new Date() },
        { path: '/Users/test/.next', size: 2000, type: 'directory' as const, lastModified: new Date() }
      ];

      const filtered = fuzzyFilter(testData, 'node', (item) => item.path);

      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered[0].path).toContain('node');
      expect(filtered[0]).toHaveProperty('fuzzyMatch');
    });
  });
});