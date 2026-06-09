import { CardInfo, CardType, Expansion } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { Card } from '../../src/card/Card';
import { CardCollection } from '../../src/card/CardCollection';
import { EffectAction } from '../../src/effects/EffectAction';
import { InstructionExecutor } from '../../src/players/InstructionExecutor';
import { SharedGameState } from '../../src/game-state/SharedGameState';

const createCardInfo = (): CardInfo => ({
  name: 'Copper',
  text: 'Treasure',
  font_size: 'small',
  cost: { coins: 0 },
  types: [CardType.TREASURE],
  expansion: Expansion.TESTING,
  mechanics: [],
});

const createCard = (id: string): Card => {
  const sharedGameState = {
    cost: vi.fn(),
    registerEffectTrigger: vi.fn(),
  } as unknown as SharedGameState;
  const card = new Card(sharedGameState, createCardInfo());
  card.setId(id);
  return card;
};

describe('EffectAction', () => {
  it('passes a single card target to the underlying action', async () => {
    const card = createCard('card-1');
    const ie = {} as InstructionExecutor;
    const action = vi.fn(async () => Promise.resolve());

    await new EffectAction(action).performAction(ie, card);

    expect(action).toHaveBeenCalledWith(ie, card);
  });

  it('passes a card collection target to the underlying action', async () => {
    const cards = CardCollection.fromCards([createCard('card-1'), createCard('card-2')]);
    const ie = {} as InstructionExecutor;
    const action = vi.fn(async () => Promise.resolve());

    await new EffectAction(action).performAction(ie, cards);

    expect(action).toHaveBeenCalledWith(ie, cards);
  });

  it('invokes a targetless action when no target is provided', async () => {
    const ie = {} as InstructionExecutor;
    const action = vi.fn(async () => Promise.resolve());

    await new EffectAction(action).performAction(ie, undefined);

    expect(action).toHaveBeenCalledWith(ie);
  });
});
