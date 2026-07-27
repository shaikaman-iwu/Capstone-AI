export function getUserFriendlyError(error, fallbackMessage) {
  if (!error) return fallbackMessage;
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  return fallbackMessage;
}

export async function runWithErrorHandling(action, { fallbackMessage, onError, onSuccess } = {}) {
  try {
    const result = await action();
    if (onSuccess) onSuccess(result);
    return result;
  } catch (error) {
    const message = getUserFriendlyError(error, fallbackMessage || 'Something went wrong.');
    if (onError) onError(message, error);
    return null;
  }
}
