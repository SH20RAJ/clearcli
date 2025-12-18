/**
 * Simple fuzzy search implementation for filtering results
 */

export interface FuzzySearchOptions {
    caseSensitive?: boolean;
    threshold?: number; // 0-1, lower is more strict
}

export interface FuzzyMatch {
    score: number;
    matches: number[];
}

/**
 * Calculate fuzzy match score for a string against a pattern
 */
export function fuzzyMatch(
    text: string,
    pattern: string,
    options: FuzzySearchOptions = {}
): FuzzyMatch | null {
    const { caseSensitive = false, threshold = 0.3 } = options;

    if (!pattern) {
        return { score: 1, matches: [] };
    }

    const searchText = caseSensitive ? text : text.toLowerCase();
    const searchPattern = caseSensitive ? pattern : pattern.toLowerCase();

    let patternIndex = 0;
    let textIndex = 0;
    const matches: number[] = [];
    let score = 0;

    while (textIndex < searchText.length && patternIndex < searchPattern.length) {
        if (searchText[textIndex] === searchPattern[patternIndex]) {
            matches.push(textIndex);
            patternIndex++;
            score += 1;
        }
        textIndex++;
    }

    // If we didn't match all pattern characters, it's not a match
    if (patternIndex < searchPattern.length) {
        return null;
    }

    // Calculate final score based on:
    // - How many characters matched
    // - How close together the matches are
    // - Length of the text
    const matchRatio = matches.length / searchPattern.length;
    const lengthRatio = searchPattern.length / searchText.length;
    const proximityBonus = calculateProximityBonus(matches);

    const finalScore = (matchRatio * 0.4) + (lengthRatio * 0.3) + (proximityBonus * 0.3);

    if (finalScore < threshold) {
        return null;
    }

    return { score: finalScore, matches };
}

/**
 * Calculate bonus score based on how close together matches are
 */
function calculateProximityBonus(matches: number[]): number {
    if (matches.length <= 1) return 1;

    let totalDistance = 0;
    for (let i = 1; i < matches.length; i++) {
        totalDistance += matches[i] - matches[i - 1];
    }

    const averageDistance = totalDistance / (matches.length - 1);
    return Math.max(0, 1 - (averageDistance / 10)); // Normalize distance
}

/**
 * Filter and sort items by fuzzy search relevance
 */
export function fuzzyFilter<T>(
    items: T[],
    pattern: string,
    getText: (item: T) => string,
    options: FuzzySearchOptions = {}
): Array<T & { fuzzyMatch: FuzzyMatch }> {
    if (!pattern) {
        return items.map(item => ({ ...item, fuzzyMatch: { score: 1, matches: [] } }));
    }

    const results: Array<T & { fuzzyMatch: FuzzyMatch }> = [];

    for (const item of items) {
        const text = getText(item);
        const match = fuzzyMatch(text, pattern, options);

        if (match) {
            results.push({ ...item, fuzzyMatch: match });
        }
    }

    // Sort by score (descending)
    return results.sort((a, b) => b.fuzzyMatch.score - a.fuzzyMatch.score);
}

/**
 * Highlight matched characters in text
 */
export function highlightMatches(text: string, matches: number[]): string {
    if (matches.length === 0) return text;

    let result = '';
    let lastIndex = 0;

    for (const matchIndex of matches) {
        // Add text before match
        result += text.slice(lastIndex, matchIndex);
        // Add highlighted character
        result += `<mark>${text[matchIndex]}</mark>`;
        lastIndex = matchIndex + 1;
    }

    // Add remaining text
    result += text.slice(lastIndex);

    return result;
}