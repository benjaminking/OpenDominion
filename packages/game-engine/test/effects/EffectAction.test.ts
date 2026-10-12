import { CardCategory, CardInfo, CardLocation, CardType, Expansion } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { Card } from '../../src/card/Card';
import { CardCollection } from '../../src/card/CardCollection';
import { EffectAction } from '../../src/effects/EffectAction';
import { EffectContext, EffectContextBuilder } from '../../src/effects/EffectContext';
import { SharedGameState } from '../../src/game-state/SharedGameState';
import { InstructionExecutor } from '../../src/players/InstructionExecutor';
import { createTestClock } from '../testClock';

const createCardInfo = (): CardInfo => ({
  category: CardCategory.CARD,
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
    ...createTestClock(),
  } as unknown as SharedGameState;
  const card = new Card(sharedGameState, createCardInfo());
  card.setId(id);
  return card;
};

describe('EffectAction', () => {
  it('passes the effect context with a single target card to the underlying action', async () => {
    const card = createCard('card-1');
    const ie = {} as InstructionExecutor;
    const action = vi.fn(async () => Promise.resolve());
    const effectContext = new EffectContextBuilder().withTargetCard(card).build();

    await new EffectAction(action).performAction(ie, effectContext);

    expect(action).toHaveBeenCalledWith(ie, effectContext);
    expect(effectContext.getTargetCard()).toBe(card);
  });

  it('passes the effect context with a card collection target to the underlying action', async () => {
    const cards = CardCollection.fromCards([createCard('card-1'), createCard('card-2')]);
    const ie = {} as InstructionExecutor;
    const action = vi.fn(async () => Promise.resolve());
    const effectContext = new EffectContextBuilder().withTargetCards(cards).build();

    await new EffectAction(action).performAction(ie, effectContext);

    expect(action).toHaveBeenCalledWith(ie, effectContext);
    expect(effectContext.getTargetCards()).toBe(cards);
  });

  it('passes the gain location of a gained card to the underlying action', async () => {
    const card = createCard('card-1');
    const ie = {} as InstructionExecutor;
    let gainLocation: CardLocation | undefined;
    const action = vi.fn(async (_ie: InstructionExecutor, effectContext: EffectContext) => {
      gainLocation = effectContext.getGainLocation();
      return Promise.resolve();
    });

    await new EffectAction(action).performAction(ie, new EffectContextBuilder().withTargetCard(card).withGainLocation(CardLocation.HAND).build());

    expect(gainLocation).toBe(CardLocation.HAND);
  });

  it('invokes an action that takes no context', async () => {
    const ie = {} as InstructionExecutor;
    const action = vi.fn(async (_ie: InstructionExecutor) => Promise.resolve());

    await new EffectAction(action).performAction(ie, new EffectContextBuilder().build());

    expect(action).toHaveBeenCalledTimes(1);
    expect(action.mock.calls[0][0]).toBe(ie);
  });
});
