import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const COPPERS = Array<string>(10).fill('Copper');

describe('Sage', () => {
  it('shuffles the discard pile, without the cards already revealed, when the deck runs out', async () => {
    const game = createGame({ kingdom: ['Sage'] });
    game.alice.setHand(['Sage', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Estate']);
    game.alice.setDiscard(['Silver']);

    await game.start();
    await game.playAction('Sage');

    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Silver']);
    expect(game.alice.discard).toEqual(['Copper', 'Estate']);
    expect(game.alice.deck).toEqual([]);
  });

  it('discards everything and takes nothing when no card costs $3 or more', async () => {
    const game = createGame({ kingdom: ['Sage'] });
    game.alice.setHand(['Sage', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper']);
    game.alice.setDiscard(['Estate', 'Curse']);

    await game.start();
    await game.playAction('Sage');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.hand).toHaveLength(4);
    expect([...game.alice.discard].sort()).toEqual(['Copper', 'Curse', 'Estate']);
    expect(game.alice.deck).toEqual([]);
  });

  it('uses current costs, so it skips a Silver while Bridge makes it cost $2', async () => {
    const game = createGame({ kingdom: ['Sage', 'Bridge', 'Village'] });
    game.alice.setHand(['Village', 'Bridge', 'Sage', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Silver', 'Copper', 'Gold', ...COPPERS]);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Bridge');
    await game.playAction('Sage');

    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Gold']);
    expect(game.alice.discard).toEqual(['Silver', 'Copper']);
  });

  it('stops at a card costing $4P but not at one costing $2P or $P', async () => {
    const game = createGame({ kingdom: ['Sage', 'University', 'Vineyard', 'Golem'] });
    game.alice.setHand(['Sage', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['University', 'Vineyard', 'Golem', 'Silver', ...COPPERS]);

    await game.start();
    await game.playAction('Sage');

    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Golem']);
    expect(game.alice.discard).toEqual(['University', 'Vineyard']);
    expect(game.alice.deck[0]).toBe('Silver');
  });
  it('uses stacked cost reductions: with Bridge and Highway in play it skips Silver ($1) and Smithy ($2) and takes Laboratory ($3)', async () => {
    const game = createGame({ kingdom: ['Sage', 'Bridge', 'Highway', 'Village'] });
    game.alice.setHand(['Village', 'Highway', 'Bridge', 'Sage', 'Copper']);
    // Village and Highway each draw a Copper first
    game.alice.setDeck(['Copper', 'Copper', 'Silver', 'Smithy', 'Laboratory', 'Gold', ...COPPERS]);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Highway');
    await game.playAction('Bridge');
    await game.playAction('Sage');

    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Laboratory']);
    expect(game.alice.discard).toEqual(['Silver', 'Smithy']);
    expect(game.alice.deck[0]).toBe('Gold');
  });

  it('takes a Peddler, which costs $8 outside the Buy phase', async () => {
    const game = createGame({ kingdom: ['Sage', 'Peddler'] });
    game.alice.setHand(['Sage', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Peddler', 'Gold', ...COPPERS]);

    await game.start();
    await game.playAction('Sage');

    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Peddler']);
    expect(game.alice.discard).toEqual(['Copper']);
  });

  it('takes a revealed Tunnel ($3) into hand without discarding it, so no Gold is gained', async () => {
    const game = createGame({ kingdom: ['Sage', 'Tunnel'] });
    game.alice.setHand(['Sage', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', 'Tunnel', ...COPPERS]);
    const golds = game.pileSize('Gold');

    await game.start();
    await game.playAction('Sage');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Tunnel']);
    expect(game.alice.discard).toEqual(['Estate']);
    expect(game.pileSize('Gold')).toBe(golds);
  });
});
