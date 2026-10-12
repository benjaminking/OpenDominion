import { describe, expect, it } from 'vitest';

import { createGame, GameHarness } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

const offeredNames = (game: GameHarness): string[] => game.pending.cardChoices.map((choice) => choice.card.name);

describe('Anvil', () => {
  it('with Quarry in play, can gain an Action card that normally costs $6', async () => {
    const game = createGame({ kingdom: ['Anvil', 'Quarry', 'Grand Market'] });
    game.alice.setHand(['Quarry', 'Anvil', 'Copper', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playTreasure('Quarry');
    await game.playTreasure('Anvil');
    // Only Treasures in hand can be discarded, and discarding is optional
    const discard = game.expectDecision('chooseCard', 'Alice');
    expect(discard.cardChoices.map((choice) => choice.card.name)).toEqual(['Copper']);
    expect(discard.noneAllowed).toBe(true);
    await game.chooseCard('Copper');
    expect(game.pending.cardChoices.map((choice) => choice.card.name)).toContain('Grand Market');
    await game.chooseCard('Grand Market');

    expect(game.alice.discard).toEqual(['Copper', 'Grand Market']);
    expect(game.alice.coins).toBe(2);
    expect(game.alice.hand).toEqual(['Estate', 'Estate']);
  });

  it("can't gain a card with a Potion in its cost, even when its $ is within $4", async () => {
    const game = createGame({ kingdom: ['Anvil', 'Familiar'] });
    game.alice.setHand(['Anvil', 'Copper', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playTreasure('Anvil');
    await game.chooseCard('Copper');

    // Familiar costs $3 and a Potion; the Potion itself costs $4
    expect(offeredNames(game)).toContain('Potion');
    expect(offeredNames(game)).toContain('Silver');
    expect(offeredNames(game)).not.toContain('Familiar');
  });

  it('uses the stacked reductions of Highway and Bridge', async () => {
    const game = createGame({ kingdom: ['Anvil', 'Highway', 'Bridge'] });
    game.alice.setHand(['Highway', 'Bridge', 'Anvil', 'Copper', 'Estate']);
    game.alice.setDeck(['Estate', ...coppers(10)]);

    await game.start();
    await game.playAction('Highway');
    await game.playAction('Bridge');
    await game.playTreasure('Anvil');
    await game.chooseCard('Copper');

    // Everything costs $2 less: Gold costs $4, Province $6
    expect(offeredNames(game)).toContain('Gold');
    expect(offeredNames(game)).not.toContain('Province');
    await game.chooseCard('Gold');
    expect(game.alice.discard).toEqual(['Copper', 'Gold']);
  });

  it('can discard any Treasure, including a Treasure-Victory Farm or a Charlatan Curse, but not other cards', async () => {
    const game = createGame({ kingdom: ['Anvil', 'Farm', 'Charlatan'] });
    game.alice.setHand(['Anvil', 'Farm', 'Charlatan Curse', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playTreasure('Anvil');
    expect([...offeredNames(game)].sort()).toEqual(['Charlatan Curse', 'Farm']);
    await game.chooseCard('Farm');
    await game.chooseCard('Silver');

    expect(game.alice.discard).toEqual(['Farm', 'Silver']);
    expect(game.alice.hand).toEqual(['Charlatan Curse', 'Estate', 'Estate']);
  });

  it('played twice by Tiara, discards a Treasure and gains a card each time', async () => {
    const game = createGame({ kingdom: ['Anvil', 'Tiara', 'Smithy'] });
    game.alice.setHand(['Tiara', 'Anvil', 'Copper', 'Silver', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playTreasure('Tiara');
    await game.chooseCard('Anvil');
    await game.chooseCard('Copper');
    await game.chooseCard('Silver');
    // Tiara offers to put the gained Silver onto the deck
    await game.declineEffects();
    await game.chooseCard('Silver');
    await game.chooseCard('Smithy');
    await game.declineEffects();

    expect(game.alice.coins).toBe(2);
    expect(game.alice.discard).toEqual(['Copper', 'Silver', 'Silver', 'Smithy']);
    expect(game.alice.hand).toEqual(['Estate']);
  });
});
