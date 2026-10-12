import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const KINGDOM = ['Stables', 'Village'];

describe('Stables', () => {
  it('draws after discarding, so a shuffle for the 3 cards includes the discarded Treasure', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Stables', 'Copper', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(['Silver']);

    await game.start();
    await game.playAction('Stables');

    const discard = game.expectDecision('chooseCard', 'Alice');
    expect(discard.noneAllowed).toBe(true);
    expect(discard.cardChoices.map((choice) => choice.card.name)).toEqual(['Copper']);
    await game.chooseCard('Copper');

    // Silver, then the discard pile (just the Copper) is shuffled and drawn
    expect(game.alice.hand).toEqual(['Estate', 'Estate', 'Estate', 'Silver', 'Copper']);
    expect(game.alice.discard).toEqual([]);
    expect(game.alice.deck).toEqual([]);
    expect(game.alice.actions).toBe(1);
  });

  it('does not ask anything without a Treasure in hand', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Stables', 'Village', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(['Silver', 'Silver', 'Silver']);

    await game.start();
    await game.playAction('Stables');

    game.expectDecision('buyPhase', 'Alice');
    expect(game.alice.hand).toEqual(['Village', 'Estate', 'Estate', 'Estate']);
    expect(game.alice.actions).toBe(0);
  });

  it('can discard a Treasure that is also a Victory card, such as Farm', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Farm'] });
    game.alice.setHand(['Stables', 'Farm', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(['Silver', 'Gold', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Stables');

    const discard = game.expectDecision('chooseCard', 'Alice');
    expect(discard.cardChoices.map((choice) => choice.card.name)).toEqual(['Farm']);
    await game.chooseCard('Farm');

    expect(game.alice.discard).toEqual(['Farm']);
    expect(game.alice.hand).toEqual(['Estate', 'Estate', 'Estate', 'Silver', 'Gold', 'Copper']);
    expect(game.alice.actions).toBe(1);
  });

  it("offers every card with the Treasure type (Coronet, Fool's Gold, Cauldron), but not Mill or Tunnel", async () => {
    const game = createGame({ kingdom: [...KINGDOM, "Fool's Gold", 'Cauldron', 'Mill', 'Tunnel'] });
    game.alice.setHand(['Stables', 'Coronet', "Fool's Gold", 'Cauldron', 'Mill', 'Tunnel']);
    game.alice.setDeck(['Silver', 'Gold', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Stables');

    const discard = game.expectDecision('chooseCard', 'Alice');
    expect(discard.cardChoices.map((choice) => choice.card.name).sort()).toEqual([
      'Cauldron',
      'Coronet',
      "Fool's Gold",
    ]);
    await game.chooseCard('Coronet');

    expect(game.alice.discard).toEqual(['Coronet']);
    expect(game.alice.hand).toHaveLength(7);
    expect(game.alice.actions).toBe(1);
  });

  it('can discard a Treasure on each play when played twice by Throne Room', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Stables', 'Copper', 'Silver']);
    game.alice.setDeck(['Estate', 'Estate', 'Gold', 'Duchy', 'Province', 'Village', 'Copper']);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Stables');
    await game.chooseCard('Copper');

    // The 2nd play can discard the Gold the 1st play drew
    const second = game.expectDecision('chooseCard', 'Alice');
    expect(second.cardChoices.map((choice) => choice.card.name).sort()).toEqual(['Gold', 'Silver']);
    await game.chooseCard('Gold');

    expect(game.alice.hand).toEqual(['Silver', 'Estate', 'Estate', 'Duchy', 'Province', 'Village']);
    expect(game.alice.discard).toEqual(['Copper', 'Gold']);
    expect(game.alice.actions).toBe(2);
  });
});
