import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';
import { offered } from './hinterlandsHelpers';

const KINGDOM = ['Highway', 'Throne Room', 'Workshop', 'Develop', 'Laboratory', 'Village', 'Smithy'];
const COPPERS = Array<string>(10).fill('Copper');

const costOf = (game: ReturnType<typeof createGame>, pileName: string): number =>
  game.state.piles.getTopCardOfPile(pileName)!.getCost().coins;

describe('Highway', () => {
  it('stacks: two Highways make cards cost $2 less, and you pay the reduced cost', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Highway', 'Highway', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Estate', ...COPPERS]);

    await game.start();
    await game.playAction('Highway');
    expect(costOf(game, 'Gold')).toBe(5);
    await game.playAction('Highway');
    expect(costOf(game, 'Gold')).toBe(4);
    expect(costOf(game, 'Estate')).toBe(0);
    expect(costOf(game, 'Copper')).toBe(0);

    await game.playAllTreasures();
    expect(game.alice.coins).toBe(4);
    const buyable = game.expectDecision('buyPhase', 'Alice').cardChoices.map((choice) => choice.card.name);
    expect(buyable).toContain('Gold');
    expect(buyable).not.toContain('Province');
    await game.buy('Gold');

    expect(game.alice.discard[0]).toBe('Gold');
    expect(game.alice.coins).toBe(0);
  });

  it('reduces costs twice when played by Throne Room', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Throne Room', 'Highway', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Highway');

    expect(costOf(game, 'Gold')).toBe(4);
    expect(costOf(game, 'Province')).toBe(6);
    expect(game.alice.actions).toBe(2);
  });

  it('changes which cards a "costing up to" choice offers', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Highway', 'Workshop', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Highway');
    await game.playAction('Workshop');

    // Laboratory ($5) costs $4 now; Gold ($6) costs $5 and is still too expensive
    const gain = game.expectDecision('chooseCard', 'Alice');
    const offered = gain.cardChoices.map((choice) => choice.card.name);
    expect(offered).toContain('Laboratory');
    expect(offered).toContain('Duchy');
    expect(offered).not.toContain('Gold');
    await game.chooseCard('Laboratory');

    expect(game.alice.discard).toEqual(['Laboratory']);
  });

  it('applies to cards in hand too, e.g. Develop trashing a Copper can gain an Estate', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Highway', 'Develop', 'Copper', 'Silver', 'Copper']);
    game.alice.setDeck(['Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Highway');
    await game.playAction('Develop');
    await game.chooseCard('Copper');

    // Copper still costs $0, Estate costs $1: only $1 cards can be gained
    const gain = game.expectDecision('chooseCard', 'Alice');
    expect([...new Set(gain.cardChoices.map((choice) => choice.card.name))]).toEqual(['Estate']);
    await game.chooseCard('Estate');

    expect(game.alice.deck[0]).toBe('Estate');
    expect(game.trash).toEqual(['Copper']);
  });

  it('stops reducing costs at the end of the turn, including for the other players', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Highway', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', ...COPPERS]);
    game.bob.setHand(['Silver', 'Silver', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Highway');
    expect(costOf(game, 'Gold')).toBe(5);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Bob');
    expect(costOf(game, 'Gold')).toBe(6);
    await game.playAllTreasures();
    const buyable = game.expectDecision('buyPhase', 'Bob').cardChoices.map((choice) => choice.card.name);
    expect(game.bob.coins).toBe(7);
    expect(buyable).toContain('Gold');
    expect(buyable).not.toContain('Province');
  });

  it('reduces only the $ part of costs with a Potion in them', async () => {
    const game = createGame({ kingdom: ['Highway', 'Golem', 'Familiar', 'Workshop', 'Village'] });
    game.alice.setHand(['Highway', 'Workshop', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Highway');

    expect(game.costOf('Golem').coins).toBe(3);
    expect(game.costOf('Golem').potions).toBe(1);
    expect(game.costOf('Familiar').coins).toBe(2);
    expect(game.costOf('Familiar').potions).toBe(1);
    expect(game.costOf('Potion').coins).toBe(3);

    // Workshop can't gain a card with a Potion in its cost
    await game.playAction('Workshop');
    const gain = game.expectDecision('chooseCard', 'Alice');
    const offered = gain.cardChoices.map((choice) => choice.card.name);
    expect(offered).toContain('Potion');
    expect(offered).not.toContain('Golem');
    expect(offered).not.toContain('Familiar');
  });

  it("is an Action in play for Peddler's Buy-phase reduction, on top of its own", async () => {
    const game = createGame({ kingdom: ['Highway', 'Peddler', 'Village'] });
    game.alice.setHand(['Highway', 'Village', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Highway');

    // Action phase: only Highway's $1
    expect(game.costOf('Peddler').coins).toBe(7);

    // Buy phase: $2 less per Action card in play (Highway and Village), then Highway's $1
    await game.playAction('Village');
    await game.playAllTreasures();
    expect(game.costOf('Peddler').coins).toBe(3);
    expect(game.alice.coins).toBe(5);
    await game.buy('Peddler');
    expect(game.alice.discard[0]).toBe('Peddler');
  });

  it('keeps reducing costs this turn after Procession has played it twice and trashed it', async () => {
    const game = createGame({ kingdom: ['Highway', 'Procession', 'Border Village', 'Smithy', 'Village'] });
    game.alice.setHand(['Procession', 'Highway', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', 'Gold', ...COPPERS]);

    await game.start();
    await game.playAction('Procession');
    await game.chooseCard('Highway');

    // Highway is in the trash, but cards still cost $2 less; it now costs $3, so Procession gains a $4 Action
    expect(game.trash).toEqual(['Highway']);
    expect(game.costOf('Gold').coins).toBe(4);
    const gain = game.expectDecision('chooseCard', 'Alice');
    expect([...new Set(gain.cardChoices.map((choice) => choice.card.name))]).toEqual(['Border Village']);
    await game.chooseCard('Border Village');

    // Border Village costs $4: a card costing less than that
    const cheaper = game.expectDecision('chooseCard', 'Alice');
    const offered = cheaper.cardChoices.map((choice) => choice.card.name);
    expect(offered).toContain('Silver');
    expect(offered).toContain('Smithy');
    expect(offered).not.toContain('Gold');
    expect(offered).not.toContain('Border Village');
    await game.chooseCard('Smithy');

    expect(game.alice.discard).toEqual(['Border Village', 'Smithy']);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Silver', 'Gold']);
    expect(game.alice.actions).toBe(2);
  });

  it('does not reduce costs on the extra turn from an Outpost played the same turn', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Outpost'] });
    game.alice.setHand(['Highway', 'Outpost', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', ...COPPERS]);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Highway');
    await game.playAction('Outpost');
    expect(costOf(game, 'Gold')).toBe(5);
    await game.endTurn();
    await game.chooseExtraTurn('Outpost');

    expect(game.currentPlayerName).toBe('Alice');
    expect(costOf(game, 'Gold')).toBe(6);
    expect(costOf(game, 'Highway')).toBe(5);
  });

  it('stacks with Bridge and Quarry, never taking a cost below $0', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Bridge', 'Quarry'] });
    game.alice.setHand(['Village', 'Bridge', 'Highway', 'Quarry', 'Copper']);
    game.alice.setDeck(['Copper', 'Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Bridge');
    await game.playAction('Highway');
    await game.playTreasure('Quarry');

    // $2 off everything, and $2 more off Actions
    expect(costOf(game, 'Province')).toBe(6);
    expect(costOf(game, 'Gold')).toBe(4);
    expect(costOf(game, 'Quarry')).toBe(2);
    expect(costOf(game, 'Estate')).toBe(0);
    expect(costOf(game, 'Laboratory')).toBe(1);
    expect(costOf(game, 'Smithy')).toBe(0);
    expect(costOf(game, 'Village')).toBe(0);

    await game.playAllTreasures();
    expect(game.alice.coins).toBe(5);
    await game.buy('Laboratory');
    expect(game.alice.coins).toBe(4);
    expect(game.alice.discard).toEqual(['Laboratory']);
  });

  it("makes cards cheaper for another player's gains during your turn, but not on their own turn", async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Militia', 'Weaver'] });
    game.alice.setHand(['Highway', 'Militia', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', ...COPPERS]);
    game.bob.setHand(['Weaver', 'Estate', 'Copper', 'Copper', 'Silver']);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Highway');
    await game.playAction('Militia');
    await game.chooseCards(['Weaver', 'Estate']);
    await game.chooseEffect('Weaver');
    await game.chooseOption('Gain a card costing up to $4');

    // Laboratory costs $4 during Alice's turn, for Bob too
    const gain = game.expectDecision('chooseCard', 'Bob');
    expect(offered(gain)).toContain('Laboratory');
    expect(offered(gain)).not.toContain('Gold');
    await game.chooseCard('Laboratory');
    expect(game.bob.discard).toContain('Laboratory');

    await game.endTurn();
    expect(game.currentPlayerName).toBe('Bob');
    expect(costOf(game, 'Laboratory')).toBe(5);
  });
});
