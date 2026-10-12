import { describe, expect, it } from 'vitest';

import { createGame, GameHarness } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

const offeredNames = (game: GameHarness): string[] => game.pending.cardChoices.map((choice) => choice.card.name);

describe('Expand', () => {
  it('trashing a Gold can gain a Platinum but not a Colony; trashing a Platinum can gain a Colony', async () => {
    const game = createGame({ kingdom: ['Expand', 'Throne Room'], useColoniesPlatinum: true });
    game.alice.setHand(['Throne Room', 'Expand', 'Gold', 'Platinum', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Expand');
    await game.chooseCard('Gold');
    expect(game.expectDecision('chooseCard', 'Alice').noneAllowed).toBe(false);
    expect(offeredNames(game)).toContain('Platinum');
    expect(offeredNames(game)).not.toContain('Colony');
    await game.chooseCard('Platinum');
    await game.chooseCard('Platinum');
    expect(offeredNames(game)).toContain('Colony');
    await game.chooseCard('Colony');

    expect(game.trash).toEqual(['Gold', 'Platinum']);
    expect(game.alice.discard).toEqual(['Platinum', 'Colony']);
    expect(game.alice.hand).toEqual(['Estate']);
  });

  it('uses the full $8 cost of a trashed Peddler in the Action phase, even with Actions in play', async () => {
    const game = createGame({ kingdom: ['Expand', 'Peddler', 'Village'], useColoniesPlatinum: true });
    game.alice.setHand(['Village', 'Expand', 'Peddler', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Expand');
    await game.chooseCard('Peddler');

    // Up to $11
    expect(offeredNames(game)).toContain('Colony');
    await game.chooseCard('Colony');
    expect(game.alice.discard).toEqual(['Colony']);
  });

  it('trashing a card with a Potion in its cost can gain a Potion card costing up to $3 more; trashing other cards cannot', async () => {
    const game = createGame({ kingdom: ['Expand', 'Golem', 'Familiar', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Expand', 'Golem', 'Silver', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Expand');
    await game.chooseCard('Golem');
    // Up to $7 and a Potion
    expect(offeredNames(game)).toContain('Golem');
    expect(offeredNames(game)).toContain('Familiar');
    expect(offeredNames(game)).toContain('Gold');
    await game.chooseCard('Familiar');
    await game.chooseCard('Silver');

    // Up to $6, no Potion
    expect(offeredNames(game)).toContain('Gold');
    expect(offeredNames(game)).not.toContain('Familiar');
    expect(offeredNames(game)).not.toContain('Golem');
    await game.chooseCard('Gold');
    expect(game.alice.discard).toEqual(['Familiar', 'Gold']);
  });

  it('still gains a card after trashing a Fortress, which goes back into your hand', async () => {
    const game = createGame({ kingdom: ['Expand', 'Fortress'] });
    game.alice.setHand(['Expand', 'Fortress', 'Estate', 'Estate', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Expand');
    await game.chooseCard('Fortress');
    expect(game.alice.hand).toContain('Fortress');

    // Fortress costs $4: up to $7
    expect(offeredNames(game)).toContain('Gold');
    expect(offeredNames(game)).not.toContain('Province');
    await game.chooseCard('Gold');
    expect(game.alice.discard).toEqual(['Gold']);
    expect(game.trash).toEqual([]);
  });

  it("in the Buy phase (via Crystal Ball), uses a trashed Peddler's reduced cost and can gain a Peddler", async () => {
    const game = createGame({ kingdom: ['Expand', 'Peddler', 'Crystal Ball'], useColoniesPlatinum: true });
    game.alice.setHand(['Crystal Ball', 'Peddler', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(['Expand', ...coppers(10)]);

    await game.start();
    await game.endActionPhase();
    await game.playTreasure('Crystal Ball');
    await game.chooseOption('Play it');
    await game.chooseCard('Peddler');

    // With Expand in play, Peddler costs $6: up to $9
    expect(offeredNames(game)).toContain('Province');
    expect(offeredNames(game)).toContain('Peddler');
    expect(offeredNames(game)).not.toContain('Colony');
    await game.chooseCard('Province');
    expect(game.alice.discard).toEqual(['Province']);
  });

  it("uses Quarry's reduction on both the trashed Action card and the gained one", async () => {
    const game = createGame({ kingdom: ['Expand', 'Quarry', 'Crystal Ball', "King's Court", 'Smithy'] });
    game.alice.setHand(['Quarry', 'Crystal Ball', 'Smithy', 'Estate', 'Estate']);
    game.alice.setDeck(['Expand', ...coppers(10)]);

    await game.start();
    await game.endActionPhase();
    await game.playTreasure('Quarry');
    await game.playTreasure('Crystal Ball');
    await game.chooseOption('Play it');
    await game.chooseCard('Smithy');

    // Smithy costs $2: up to $5. King's Court costs $5, Gold still $6
    expect(offeredNames(game)).toContain("King's Court");
    expect(offeredNames(game)).not.toContain('Gold');
    await game.chooseCard("King's Court");
    expect(game.alice.discard).toEqual(["King's Court"]);
  });

  it('treats a trashed card that stacked reductions take below $0 as costing $0', async () => {
    const game = createGame({ kingdom: ['Expand', 'Highway', 'Bridge', 'Village'] });
    game.alice.setHand(['Village', 'Highway', 'Highway', 'Bridge', 'Expand', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Highway');
    await game.playAction('Highway');
    await game.playAction('Bridge');
    await game.playAction('Expand');
    await game.chooseCard('Estate');

    // Everything costs $3 less. Estate costs $0, so up to $3: Gold ($3) but not Province ($5)
    expect(offeredNames(game)).toContain('Gold');
    expect(offeredNames(game)).not.toContain('Province');
    await game.chooseCard('Gold');
    expect(game.alice.discard).toEqual(['Gold']);
  });

  it('only offers the top card of the Knights pile, and no non-Supply cards such as Madman', async () => {
    const game = createGame({ kingdom: ['Expand', 'Knights', 'Hermit'] });
    game.alice.setHand(['Expand', 'Silver', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));
    game.setPile('Knights', ['Dame Anna', 'Sir Martin']);

    await game.start();
    await game.playAction('Expand');
    await game.chooseCard('Silver');

    // Up to $6: Dame Anna ($5) is on top; Sir Martin ($4) is underneath
    expect(offeredNames(game)).toContain('Dame Anna');
    expect(offeredNames(game)).not.toContain('Sir Martin');
    expect(offeredNames(game)).not.toContain('Madman');
    await game.chooseCard('Dame Anna');
    expect(game.pileCards('Knights')).toEqual(['Sir Martin']);
  });

  it('gaining the last Province ends the game only after the turn', async () => {
    const game = createGame({ kingdom: ['Expand'] });
    game.alice.setHand(['Expand', 'Gold', 'Silver', 'Silver', 'Estate']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));
    game.setPileSize('Province', 1);

    await game.start();
    await game.playAction('Expand');
    await game.chooseCard('Gold');
    await game.chooseCard('Province');

    expect(game.pileSize('Province')).toBe(0);
    expect(game.isFinished).toBe(false);
    await game.playAllTreasures();
    await game.buy('Silver');

    expect(game.isFinished).toBe(true);
    expect(game.alice.discard).toEqual(expect.arrayContaining(['Province', 'Silver']));
  });
});
