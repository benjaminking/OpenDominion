import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

const offeredNames = (game: ReturnType<typeof createGame>): string[] =>
  game.expectDecision('chooseCard', 'Alice').cardChoices.map((choice) => choice.card.name);

describe('Upgrade', () => {
  it('must trash a card and offers only cards costing exactly $1 more', async () => {
    const game = createGame({ kingdom: ['Upgrade'] });
    game.alice.setHand(['Upgrade', 'Estate', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(Array<string>(10).fill('Copper'));

    await game.start();
    await game.playAction('Upgrade');
    expect(game.expectDecision('chooseCard', 'Alice').noneAllowed).toBe(false);
    await game.chooseCard('Estate');

    const offered = offeredNames(game);
    expect(offered).toContain('Silver');
    expect(offered).toContain('Village');
    expect(offered).not.toContain('Estate');
    expect(offered).not.toContain('Smithy');
    await game.chooseCard('Silver');
    expect(game.alice.discard).toEqual(['Silver']);
    expect(game.trash).toEqual(['Estate']);
  });

  it('gains nothing when no card costs exactly $1 more', async () => {
    const game = createGame({ kingdom: ['Upgrade'] });
    game.alice.setHand(['Upgrade', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(Array<string>(10).fill('Copper'));

    await game.start();
    await game.playAction('Upgrade');
    await game.chooseCard('Copper');

    expect(game.trash).toEqual(['Copper']);
    expect(game.alice.discard).toEqual([]);
    game.expectDecision(['treasurePhase', 'buyPhase'], 'Alice');
  });

  it('uses costs reduced by Bridge for both cards, so a Copper can become an Estate', async () => {
    const game = createGame({ kingdom: ['Upgrade', 'Bridge'] });
    game.alice.setHand(['Bridge', 'Upgrade', 'Copper']);
    game.alice.setDeck(['Copper', 'Copper', ...Array<string>(10).fill('Copper')]);
    game.alice.addToHand('Village');

    await game.start();
    await game.playAction('Village');
    await game.playAction('Bridge');
    await game.playAction('Upgrade');
    await game.chooseCard('Copper');

    // Copper still costs $0; Estate and other printed-$2 cards cost $1
    const offered = offeredNames(game);
    expect(offered).toContain('Estate');
    expect(offered).toContain('Cellar');
    expect(offered).not.toContain('Silver');
    expect(offered).not.toContain('Copper');
    await game.chooseCard('Estate');
    expect(game.alice.discard).toEqual(['Estate']);
  });

  it('does nothing when the hand is empty after drawing', async () => {
    const game = createGame({ kingdom: ['Upgrade'] });
    game.alice.setHand(['Upgrade']);

    await game.start();
    await game.playAction('Upgrade');

    expect(game.trash).toEqual([]);
    expect(game.alice.actions).toBe(1);
    expect(game.pending.kind).not.toBe('chooseCard');
  });

  it('keeps the Potion part of the cost: a $3P card becomes a $4P card', async () => {
    const game = createGame({ kingdom: ['Upgrade', 'Familiar', 'Golem'] });
    game.alice.setHand(['Upgrade', 'Familiar', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Upgrade');
    await game.chooseCard('Familiar');

    expect(offeredNames(game)).toEqual(['Golem']);
    await game.chooseCard('Golem');
    expect(game.alice.discard).toEqual(['Golem']);
  });

  it('does not offer a Potion-cost card for a card without a Potion in its cost', async () => {
    const game = createGame({ kingdom: ['Upgrade', 'Golem'] });
    game.alice.setHand(['Upgrade', 'Silver', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Upgrade');
    await game.chooseCard('Silver');

    const offered = offeredNames(game);
    expect(offered).toContain('Smithy');
    expect(offered).toContain('Potion');
    expect(offered).not.toContain('Golem');
  });

  it('still gains a card after trashing a Fortress, which returns to hand', async () => {
    const game = createGame({ kingdom: ['Upgrade', 'Fortress'] });
    game.alice.setHand(['Upgrade', 'Fortress', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Upgrade');
    await game.chooseCard('Fortress');

    // Official FAQ (Fortress): "You still trashed Fortress, even though you got it back"
    expect(game.alice.hand).toContain('Fortress');
    expect(game.trash).toEqual([]);
    const offered = offeredNames(game);
    expect(offered).toContain('Market');
    expect(offered).not.toContain('Smithy');
    await game.chooseCard('Market');
    expect(game.alice.discard).toEqual(['Market']);
  });

  it('uses costs reduced by Highway', async () => {
    const game = createGame({ kingdom: ['Upgrade', 'Highway'] });
    game.alice.setHand(['Highway', 'Upgrade', 'Silver', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Highway');
    await game.playAction('Upgrade');
    await game.chooseCard('Silver');

    // Silver costs $2, so printed-$4 cards ($3 now) are offered
    const offered = offeredNames(game);
    expect(offered).toContain('Smithy');
    expect(offered).not.toContain('Village');
    expect(offered).not.toContain('Market');
  });

  it('uses the trashed card cost at that moment: a Peddler trashed in the Buy phase (via Coronet) is cheaper', async () => {
    const game = createGame({ kingdom: ['Upgrade', 'Peddler'] });
    game.alice.setHand(['Coronet', 'Upgrade', 'Peddler', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.endActionPhase();
    await game.playTreasure('Coronet');
    await game.chooseCard('Upgrade');
    await game.chooseCard('Peddler');

    // Buy phase with Coronet and Upgrade in play: Peddler costs $8 - $4 = $4, so $5 cards are offered
    const offered = offeredNames(game);
    expect(offered).toContain('Market');
    expect(offered).toContain('Duchy');
    expect(offered).not.toContain('Province');
  });

  it('floors stacked Bridge reductions at $0: an Estate (now $0) becomes a card now costing exactly $1', async () => {
    const game = createGame({ kingdom: ['Upgrade', 'Bridge'] });
    game.alice.setHand(['Village', 'Bridge', 'Bridge', 'Upgrade', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start(() => {
      game.alice.player.getStatistics().addActions(1);
    });
    await game.playAction('Village');
    await game.playAction('Bridge');
    await game.playAction('Bridge');
    await game.playAction('Upgrade');
    await game.chooseCard('Estate');

    // Printed-$3 cards cost $1; printed-$2 cards cost $0 like the Estate
    const offered = offeredNames(game);
    expect(offered).toContain('Silver');
    expect(offered).toContain('Village');
    expect(offered).not.toContain('Estate');
    expect(offered).not.toContain('Cellar');
    expect(offered).not.toContain('Smithy');
  });

  it("uses Quarry's reduction on Action cards when played by Coronet in the Buy phase", async () => {
    const game = createGame({ kingdom: ['Upgrade', 'Quarry'] });
    game.alice.setHand(['Quarry', 'Coronet', 'Upgrade', 'Village']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.endActionPhase();
    await game.playTreasure('Quarry');
    await game.playTreasure('Coronet');
    await game.chooseCard('Upgrade');
    await game.chooseCard('Village');

    // Village costs $1: exactly $2 is an Estate, or a printed-$4 Action card
    const offered = offeredNames(game);
    expect(offered).toContain('Estate');
    expect(offered).toContain('Smithy');
    expect(offered).not.toContain('Silver');
    expect(offered).not.toContain('Cellar');
  });
});
