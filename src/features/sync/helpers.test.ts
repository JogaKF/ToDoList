import { describe, expect, it } from 'vitest';

import { isRemoteNewer, parseSyncPayload, resolveLastWriteWins, serializeSyncPayload } from './helpers';

describe('sync helpers', () => {
  it('serializes queue payloads safely', () => {
    const raw = serializeSyncPayload({ id: 'item-1', title: 'Task' });
    expect(parseSyncPayload<{ id: string; title: string }>(raw)).toEqual({ id: 'item-1', title: 'Task' });
    expect(parseSyncPayload(serializeSyncPayload(undefined))).toEqual({});
  });

  it('uses Last Write Wins by updatedAt and deletedAt', () => {
    expect(isRemoteNewer({ updatedAt: '2026-04-20T10:00:00.000Z' }, { updatedAt: '2026-04-21T10:00:00.000Z' })).toBe(true);
    expect(isRemoteNewer({ deletedAt: '2026-04-22T10:00:00.000Z' }, { updatedAt: '2026-04-21T10:00:00.000Z' })).toBe(false);

    expect(
      resolveLastWriteWins(
        { id: 'local', updatedAt: '2026-04-20T10:00:00.000Z' },
        { id: 'remote', updatedAt: '2026-04-21T10:00:00.000Z' }
      )
    ).toEqual({ id: 'remote', updatedAt: '2026-04-21T10:00:00.000Z' });
  });
});
