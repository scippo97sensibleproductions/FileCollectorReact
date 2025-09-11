/**
 * Converts a gitignore pattern string into a regular expression.
 * This function is the heart of the gitignore logic.
 *
 * @param pattern The gitignore pattern string.
 * @returns A RegExp object that implements the pattern's matching rules.
 */
function patternToRegex(pattern: string): RegExp {
    // A slash "/" is used as the directory separator.
    // Let's create the regex string part by part.
    let regexString = pattern
        // 1. Escape special RegExp characters, except for '*', '?', and '\'.
        .replace(/[.+^${}()|[\]]/g, '\\$&')
        // 2. Handle escaped characters from gitignore spec.
        // \! -> !, \# -> #, etc.
        .replace(/\\([!#*? ])/g, '$1')
        // 3. Convert gitignore wildcards to RegExp wildcards.
        // An asterisk "*" matches anything except a slash.
        .replace(/\*/g, '[^/]*')
        // The character "?" matches any one character except "/".
        .replace(/\?/g, '[^/]');

    // 4. Handle double-asterisk "**" special cases.
    if (regexString.startsWith('**/')) {
        // A leading "**" followed by a slash means match in all directories.
        // e.g., "**/foo" is equivalent to "foo". We achieve this by allowing
        // the pattern to be preceded by anything or nothing, including directories.
        regexString = '(?:.*/)?' + regexString.substring(3);
    }

    // A slash followed by "**" then a slash matches zero or more directories.
    // e.g., "a/**/b"
    regexString = regexString.replace(/\/\*\*(\/|$)/g, '(?:/.+)*$1');

    // A trailing "/**" matches everything inside.
    // e.g., "abc/**" -> we want to match "abc" and everything after it.
    regexString = regexString.replace(/\/$/g, '/**').replace(/\/(\*\*)$/, '(?:/.*)?');

    // 5. Handle anchoring based on the presence of a slash.
    // If there is a separator at the beginning or middle, the pattern is
    // relative to the directory level of the particular .gitignore file.
    // Since we are checking against a full path, this means it's anchored
    // to the start of the path.
    if (pattern.includes('/') && !pattern.startsWith('**/')) {
        regexString = '^' + regexString;
    } else {
        // Otherwise, the pattern can match at any level.
        // It must match from the start of the string or after a slash.
        regexString = '(?:^|/)' + regexString;
    }

    // 6. Handle directory-only patterns.
    // If there is a separator at the end, the pattern will only match directories.
    if (pattern.endsWith('/')) {
        // It must match the path as a directory (ending with a slash or being the full path).
        regexString += '$';
    } else {
        // Otherwise, it can match a file or a directory.
        // So, it must match the full path, or the path as a directory prefix.
        regexString += '(?:/.*)?$';
    }

    return new RegExp(regexString);
}


/**
 * Processes a raw GitIgnoreItem into a structured ProcessedPattern object.
 * This filters out comments and blank lines and prepares the regex.
 *
 * @param item The GitIgnoreItem to process.
 * @returns A ProcessedPattern object, or null if the line is a comment or blank.
 */
export function processPattern(item: GitIgnoreItem): ProcessedPattern | null {
    let pattern = item.pattern.trim();

    // A blank line matches no files.
    // A line starting with # serves as a comment.
    if (pattern === '' || pattern.startsWith('#')) {
        return null;
    }

    // An optional prefix "!" which negates the pattern.
    const isNegated = pattern.startsWith('!');
    if (isNegated) {
        pattern = pattern.substring(1);
    }

    // Handle escaped leading "!"
    if (pattern.startsWith('\\!')) {
        pattern = pattern.substring(1);
    }

    const regex = patternToRegex(pattern);

    return {
        originalPattern: item.pattern,
        pattern: pattern,
        isNegated: isNegated,
        regex: regex,
    };
}

function findLastMatch(path: string, patterns: ProcessedPattern[]): ProcessedPattern | null {
    let lastMatch: ProcessedPattern | null = null;
    for (const p of patterns) {
        if (p.regex.test(path)) {
            lastMatch = p;
        }
    }
    return lastMatch;
}

export function checkIgnore(processedPatterns: ProcessedPattern[], fullPath: string): boolean {
    const targetMatch = findLastMatch(fullPath, processedPatterns);

    if (!targetMatch) {
        return false;
    }

    if (targetMatch.isNegated) {
        let parent = fullPath;
        while (parent.includes('/')) {
            parent = parent.substring(0, parent.lastIndexOf('/'));
            if (parent === '') break;

            const parentDirectoryPath = parent + '/';
            const parentMatch = findLastMatch(parentDirectoryPath, processedPatterns);

            if (parentMatch && !parentMatch.isNegated) {
                return true;
            }
        }
        return false;
    }

    return true;
}

export function shouldIgnore(items: GitIgnoreItem[], fullPath: string): boolean {
    const patterns = items.map(processPattern).filter(Boolean) as ProcessedPattern[];
    return checkIgnore(patterns, fullPath);
}