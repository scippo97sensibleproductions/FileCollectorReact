export function estimateTokens(text: string): number {
    if (!text) {
        return 0;
    }

    const tokenRegex = /[\w]+|[^\s\w]/g;
    const tokens = text.match(tokenRegex);

    return tokens?.length ?? 0;
}