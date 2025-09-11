interface ProcessedPattern {
    // The original pattern string.
    pattern: string;
    // True if the pattern is a negation (starts with '!').
    isNegated: boolean;
    // The generated regular expression for matching paths.
    regex: RegExp;
    // The original pattern before negation and whitespace trimming.
    originalPattern: string;
}