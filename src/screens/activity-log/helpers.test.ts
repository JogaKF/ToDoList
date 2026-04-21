import { describe, expect, it } from 'vitest';

import { getAuditContext } from './helpers';

describe('activity log screen helpers', () => {
  it('builds readable context from item and list', () => {
    expect(getAuditContext('Task', 'Lista')).toBe('Task • Lista');
    expect(getAuditContext(null, 'Lista')).toBe('Lista');
    expect(getAuditContext(null, null)).toBe('Brak kontekstu');
  });
});
