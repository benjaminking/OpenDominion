import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

describe('Plaza', () => {
  it('can discard the Treasure it just drew for +1 Coffers', async () => {
    const game = createGame({ kingdom: ['Plaza'] });
    game.alice.setHand(['Plaza', 'Estate']);
    game.alice.setDeck(['Silver', ...coppers(10)]);

    await game.start();
    await game.playAction('Plaza');
    expect(game.pending.cardChoices.map((choice) => choice.card.name)).toEqual(['Silver']);
    await game.chooseCard('Silver');

    expect(game.alice.discard).toEqual(['Silver']);
    expect(game.alice.coffers).toBe(1);
    expect(game.alice.actions).toBe(2);
  });

  it('offers nothing to discard when there is no Treasure in hand', async () => {
    const game = createGame({ kingdom: ['Plaza'] });
    game.alice.setHand(['Plaza', 'Estate']);
    game.alice.setDeck(['Estate', ...coppers(10)]);

    await game.start();
    await game.playAction('Plaza');

    game.expectDecision('buyPhase', 'Alice');
    expect(game.alice.coffers).toBe(0);
    expect(game.alice.hand).toEqual(['Estate', 'Estate']);
  });

  it('can discard Coronet, an Action–Treasure, for +1 Coffers', async () => {
    const game = createGame({ kingdom: ['Plaza'] });
    game.alice.setHand(['Plaza', 'Coronet', 'Estate']);
    game.alice.setDeck(['Estate', ...coppers(10)]);

    await game.start();
    await game.playAction('Plaza');
    expect(game.pending.cardChoices.map((choice) => choice.card.name)).toEqual(['Coronet']);
    await game.chooseCard('Coronet');

    expect(game.alice.discard).toEqual(['Coronet']);
    expect(game.alice.coffers).toBe(1);
  });

  it('offers Treasures of every kind: a Treasure–Victory Farm, a Treasure–Reaction and a Curse that is a Treasure', async () => {
    const game = createGame({ kingdom: ['Plaza', 'Farm', "Fool's Gold", 'Charlatan'] });
    game.alice.setHand(['Plaza', 'Farm', "Fool's Gold", 'Charlatan Curse', 'Estate']);

    await game.start();
    await game.playAction('Plaza');
    game.expectDecision('chooseCard', 'Alice');
    expect(game.pending.cardChoices.map((choice) => choice.card.name).sort()).toEqual([
      'Charlatan Curse',
      'Farm',
      "Fool's Gold",
    ]);
    await game.chooseCard('Farm');

    expect(game.alice.discard).toEqual(['Farm']);
    expect(game.alice.coffers).toBe(1);
  });

  it('with an empty deck, draws nothing but can still discard a Treasure for +1 Coffers', async () => {
    const game = createGame({ kingdom: ['Plaza'] });
    game.alice.setHand(['Plaza', 'Copper']);

    await game.start();
    await game.playAction('Plaza');
    await game.chooseCard('Copper');

    expect(game.alice.hand).toEqual([]);
    expect(game.alice.actions).toBe(2);
    expect(game.alice.coffers).toBe(1);
  });

  it('played twice by Throne Room, can discard a Treasure each time for +2 Coffers', async () => {
    const game = createGame({ kingdom: ['Plaza', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Plaza', 'Copper']);
    game.alice.setDeck(['Silver', 'Estate', ...coppers(5)]);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Plaza');
    await game.chooseCard('Silver');
    await game.chooseCard('Copper');

    expect(game.alice.hand).toEqual(['Estate']);
    expect(game.alice.discard).toEqual(['Silver', 'Copper']);
    expect(game.alice.coffers).toBe(2);
    expect(game.alice.actions).toBe(4);
  });
});
