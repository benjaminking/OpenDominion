import { describe, expect, it, vi } from 'vitest';

import { Pile } from '../../src/piles/Pile';
import { AddedPilePostAction } from '../../src/setup/AddedPilePostAction';

describe('AddedPilePostAction', () => {
  it('performs its action on the added pile each time it is invoked', () => {
    const action = vi.fn();
    const firstPile = { name: 'Moat' } as Pile;
    const secondPile = { name: 'Village' } as Pile;
    const postAction = new AddedPilePostAction(action);

    postAction.performAction(firstPile);
    postAction.performAction(secondPile);

    expect(action).toHaveBeenNthCalledWith(1, firstPile);
    expect(action).toHaveBeenNthCalledWith(2, secondPile);
  });
});
