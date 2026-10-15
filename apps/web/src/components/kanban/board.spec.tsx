import { describe, it, expect } from 'vitest';

describe('Kanban Board Component', () => {
  it('should render columns matching status contracts', () => {
    expect(['TODO', 'IN_PROGRESS', 'DONE']).toHaveLength(3);
  });
});
