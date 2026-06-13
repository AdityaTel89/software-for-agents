import { describe, it, expect } from 'vitest';
import { VERSION } from './index.js';

describe('core package', () => {
  it('should export version', () => {
    expect(VERSION).toBe('1.0.0');
  });
});
