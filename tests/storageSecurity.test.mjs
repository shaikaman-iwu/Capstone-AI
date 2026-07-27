import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeStateForStorage } from '../src/shared/lib/storage.js';

test('removes sensitive and PHI-like fields before persisting state', () => {
  const state = {
    user: {
      name: 'Dr. Elena Ruiz',
      email: 'elena@example.com',
      password: 'secret-pass',
      token: 'sess_abc123',
      role: 'physician',
    },
    patients: [
      {
        id: 'p1',
        name: 'Sam Torres',
        mrn: 'MRN-10021',
        dob: '1990-01-05',
        chief: 'Annual physical',
        transcript: [['Clinician', 'secret transcript']],
        priorNotes: [{ text: 'sensitive note' }],
        problemList: ['Hypertension'],
      },
    ],
    activePatient: {
      id: 'p1',
      name: 'Sam Torres',
      transcript: [['Clinician', 'secret transcript']],
      problemList: ['Hypertension'],
    },
    draft: { subjective: { text: 'draft text' } },
    review: { subjective: { text: 'review text' } },
    visits: [{ id: 'v1', patientName: 'Sam Torres', provider: 'Dr. Elena Ruiz', signed: false }],
  };

  const sanitized = sanitizeStateForStorage(state);

  assert.equal(sanitized.user.password, undefined);
  assert.equal(sanitized.user.token, undefined);
  assert.equal(sanitized.patients[0].transcript, undefined);
  assert.equal(sanitized.patients[0].priorNotes, undefined);
  assert.equal(sanitized.patients[0].problemList, undefined);
  assert.equal(sanitized.activePatient.transcript, undefined);
  assert.equal(sanitized.activePatient.problemList, undefined);
  assert.equal(sanitized.draft, undefined);
  assert.equal(sanitized.review, undefined);
  assert.equal(sanitized.visits[0].patientName, 'Sam Torres');
});
