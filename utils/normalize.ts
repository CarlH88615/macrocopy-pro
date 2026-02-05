export const normalizeEmailText = (text: string): string => {
  return text
    // collapse 3+ blank lines to exactly 2
    .replace(/\n{3,}/g, '\n\n')
    // trim trailing whitespace per line
    .replace(/[ \t]+$/gm, '')
    // trim overall
    .trim();
};
