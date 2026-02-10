import { describe, expect, it } from 'vitest';
import { bumpRecentTags } from './recentTags';

describe('recent tags', () => {
  it('bumps a tag to the front and dedupes', () => {
    expect(bumpRecentTags({ recent: ['press', 'switch'], tag: 'switch', cap: 5 })).toEqual([
      'switch',
      'press'
    ]);
  });

  it('trims and caps', () => {
    expect(bumpRecentTags({ recent: ['a', 'b', 'c'], tag: ' d ', cap: 3 })).toEqual(['d', 'a', 'b']);
  });

  it('ignores empty tags', () => {
    expect(bumpRecentTags({ recent: ['a'], tag: '   ', cap: 5 })).toEqual(['a']);
  });
});

