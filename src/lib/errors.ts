const GENERIC_ERROR = 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.';

function readMessage(err: unknown): string | null {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const message = (err as { message: unknown }).message;
    if (typeof message === 'string' && message.length > 0) return message;
  }
  return null;
}

export function describeError(err: unknown): string {
  if (err instanceof TypeError && /fetch/i.test(err.message)) {
    return 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.';
  }
  return readMessage(err) ?? GENERIC_ERROR;
}

const AUTH_MESSAGES: { match: RegExp; message: string }[] = [
  { match: /invalid login credentials/i, message: 'E-posta veya şifre hatalı.' },
  { match: /user already registered/i, message: 'Bu e-posta adresiyle zaten bir hesap var.' },
  { match: /password should be at least/i, message: 'Şifre en az 6 karakter olmalıdır.' },
  { match: /email not confirmed/i, message: 'E-posta adresiniz henüz doğrulanmamış.' },
  { match: /rate limit|too many requests/i, message: 'Çok fazla deneme yapıldı. Lütfen biraz bekleyin.' },
];

export function describeAuthError(err: unknown): string {
  const message = readMessage(err);
  if (message) {
    const known = AUTH_MESSAGES.find((entry) => entry.match.test(message));
    if (known) return known.message;
  }
  return describeError(err);
}
