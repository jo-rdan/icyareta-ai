/**
 * Capitalizes the first letter of a given word.
 * * @param word - The string to be capitalized.
 * @returns The capitalized string.
 */
export const capitalize = (word: string): string => {
  if (!word) return "";

  const firstLetter = word.charAt(0).toUpperCase();
  const restOfWord = word.slice(1).toLowerCase();

  return `${firstLetter}${restOfWord}`;
};
