const TECHNICAL_DETAIL_PATTERN = /\b(azure|severity|category|provider|stack trace|exception)\b/i;
const GENERIC_STATUS_TEXT_PATTERN = /^(unprocessable entity|bad request|forbidden|unauthorized|not found|internal server error)$/i;

export function isModerationError(error) {
  return Number(error?.status ?? error?.response?.status) === 422;
}

export function getModerationErrorMessage(error, fallback) {
  const candidates = [
    error?.response?.data?.message,
    error?.response?.data?.detail,
    error?.response?.data?.title,
    error?.message,
  ];

  for (const candidate of candidates) {
    const message = String(candidate ?? '').trim();
    if (message && !TECHNICAL_DETAIL_PATTERN.test(message) && !GENERIC_STATUS_TEXT_PATTERN.test(message)) {
      return message;
    }
  }

  return fallback;
}
