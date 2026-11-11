export function normalizeAnswer(text: string): string {
  return text.normalize('NFC').trim().toLocaleLowerCase('fi-FI');
}

export function isAnswerCorrect(typed: string, target: string): boolean {
  return normalizeAnswer(typed) === normalizeAnswer(target);
}
