import test from 'node:test';
import assert from 'node:assert/strict';
import { runWithErrorHandling, getUserFriendlyError } from '../src/shared/lib/errorHandling.js';

test('returns the action result when it succeeds', async () => {
  const result = await runWithErrorHandling(async () => 'ok', {
    fallbackMessage: 'Something went wrong',
    onError: () => {},
  });

  assert.equal(result, 'ok');
});

test('surface a helpful message when an action throws', async () => {
  let latestMessage = null;
  const result = await runWithErrorHandling(async () => {
    throw new Error('Network error');
  }, {
    fallbackMessage: 'Could not complete that action.',
    onError: (message) => {
      latestMessage = message;
    },
  });

  assert.equal(result, null);
  assert.equal(latestMessage, 'Network error');
});

test('falls back to a friendly message when no error is provided', () => {
  assert.equal(getUserFriendlyError(null, 'Could not complete that action.'), 'Could not complete that action.');
  assert.equal(getUserFriendlyError('Bad input', 'Could not complete that action.'), 'Bad input');
});
