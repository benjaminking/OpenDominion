import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

describe('Bishop', () => {
  it('makes you trash a card, then each other player may trash one, in turn order (3 players)', async () => {
    const game = createGame({ kingdom: ['Bishop'], players: ['Alice', 'Bob', 'Cara'] });
    const cara = game.player('Cara');
    game.alice.setHand(['Bishop', 'Gold', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Estate', 'Copper', 'Copper', 'Copper', 'Copper']);
    cara.setHand(['Curse', 'Copper', 'Copper', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Bishop');
    expect(game.expectDecision('chooseCard', 'Alice').noneAllowed).toBe(false);
    await game.chooseCard('Gold');
    expect(game.expectDecision('chooseCard', 'Bob').noneAllowed).toBe(true);
    await game.chooseCard('Estate');
    expect(game.expectDecision('chooseCard', 'Cara').noneAllowed).toBe(true);
    await game.chooseNone();

    // +1 VP, plus 1 VP per $2 of Gold's $6
    expect(game.alice.vpTokens).toBe(4);
    expect(game.alice.coins).toBe(1);
    expect(game.bob.vpTokens).toBe(0);
    expect(game.trash).toEqual(['Gold', 'Estate']);
    expect(cara.hand).toContain('Curse');
  });

  it('ignores Potion in the cost of the trashed card', async () => {
    const game = createGame({ kingdom: ['Bishop', 'Golem'] });
    game.alice.setHand(['Bishop', 'Golem', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));

    await game.start();
    await game.playAction('Bishop');
    await game.chooseCard('Golem');
    await game.chooseNone();

    // Golem costs $4 and a Potion: +1 VP, plus 2 VP
    expect(game.alice.vpTokens).toBe(3);
  });

  it('played by Throne Room, trashes two cards and lets the other players trash twice', async () => {
    const game = createGame({ kingdom: ['Bishop', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Bishop', 'Silver', 'Estate', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Estate', 'Curse', 'Copper', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Bishop');
    await game.chooseCard('Silver');
    await game.chooseCard('Curse');
    await game.chooseCard('Estate');
    await game.chooseCard('Estate');

    // (1 + 1) for Silver ($3) and (1 + 1) for Estate ($2)
    expect(game.alice.vpTokens).toBe(4);
    expect(game.alice.coins).toBe(2);
    expect(game.alice.hand).toEqual(['Copper']);
    expect(game.bob.hand).toEqual(['Copper', 'Copper', 'Copper']);
    expect(game.bob.vpTokens).toBe(0);
  });

  it('counts the VP tokens in the final score', async () => {
    const game = createGame({ kingdom: ['Bishop'] });
    game.alice.setHand(['Bishop', 'Gold', 'Platinum', 'Gold', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));
    game.setPileSize('Province', 1);

    await game.start();
    await game.playAction('Bishop');
    await game.chooseCard('Copper');
    await game.chooseNone();
    await game.playAllTreasures();
    await game.buy('Province');

    expect(game.isFinished).toBe(true);
    const result = game.state.getGameResult()!;
    const aliceResult = result.playerResults.find((playerResult) => playerResult.playerName === 'Alice')!;
    // Province (6) and the Bishop's 1 VP token (the trashed Copper costs $0)
    expect(aliceResult.scoreReport.total).toBe(7);
  });

  it("uses the trashed card's current cost, e.g. reduced by Bridge", async () => {
    const game = createGame({ kingdom: ['Bishop', 'Bridge', 'Village'] });
    game.alice.setHand(['Village', 'Bridge', 'Bishop', 'Gold', 'Copper']);
    game.alice.setDeck(['Estate', ...coppers(10)]);
    game.bob.setHand(coppers(5));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Bridge');
    await game.playAction('Bishop');
    await game.chooseCard('Gold');
    await game.chooseNone();

    // Gold costs $5 this turn: +1 VP, plus 2 VP
    expect(game.alice.vpTokens).toBe(3);
  });

  it("lets another player trash a card that has its own when-trashed ability, e.g. Rats' +1 Card", async () => {
    const game = createGame({ kingdom: ['Bishop', 'Rats'] });
    game.alice.setHand(['Bishop', 'Estate', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Rats', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(['Gold', ...coppers(5)]);

    await game.start();
    await game.playAction('Bishop');
    await game.chooseCard('Estate');
    await game.chooseCard('Rats');

    expect(game.trash).toEqual(['Estate', 'Rats']);
    expect(game.bob.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Gold']);
    expect(game.bob.vpTokens).toBe(0);
    expect(game.pending.playerName).toBe('Alice');
  });

  it('gives VP for a trashed Fortress, which goes back into your hand', async () => {
    const game = createGame({ kingdom: ['Bishop', 'Fortress'] });
    game.alice.setHand(['Bishop', 'Fortress', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));

    await game.start();
    await game.playAction('Bishop');
    await game.chooseCard('Fortress');
    await game.chooseNone();

    // +1 VP, and +2 VP for Fortress's $4
    expect(game.alice.vpTokens).toBe(3);
    expect(game.alice.hand).toContain('Fortress');
    expect(game.trash).toEqual([]);
  });

  it("uses a trashed Peddler's Buy-phase cost when Crystal Ball plays Bishop in the Buy phase", async () => {
    const game = createGame({ kingdom: ['Bishop', 'Peddler', 'Crystal Ball'] });
    game.alice.setHand(['Crystal Ball', 'Peddler', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(['Bishop', ...coppers(10)]);
    game.bob.setHand(coppers(5));

    await game.start();
    await game.endActionPhase();
    await game.playTreasure('Crystal Ball');
    await game.chooseOption('Play it');
    await game.chooseCard('Peddler');
    await game.chooseNone();

    // Peddler costs $6 with Bishop in play: +1 VP, plus 3 VP
    expect(game.trash).toEqual(['Peddler']);
    expect(game.alice.vpTokens).toBe(4);
  });

  it("uses Quarry's reduction for a trashed Action card", async () => {
    const game = createGame({ kingdom: ['Bishop', 'Quarry', 'Crystal Ball', "King's Court"] });
    game.alice.setHand(['Quarry', 'Crystal Ball', "King's Court", 'Estate', 'Estate']);
    game.alice.setDeck(['Bishop', ...coppers(10)]);
    game.bob.setHand(coppers(5));

    await game.start();
    await game.endActionPhase();
    await game.playTreasure('Quarry');
    await game.playTreasure('Crystal Ball');
    await game.chooseOption('Play it');
    await game.chooseCard("King's Court");
    await game.chooseNone();

    // King's Court costs $5 this turn: +1 VP, plus 2 VP
    expect(game.alice.vpTokens).toBe(3);
  });

  it('gives no VP (and takes none away) for a card whose stacked reductions take it below $0', async () => {
    const game = createGame({ kingdom: ['Bishop', 'Highway', 'Bridge', 'Village'] });
    game.alice.setHand(['Village', 'Highway', 'Highway', 'Bridge', 'Bishop', 'Estate']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Highway');
    await game.playAction('Highway');
    await game.playAction('Bridge');
    await game.playAction('Bishop');
    await game.chooseCard('Estate');
    await game.chooseNone();

    // Estate costs $2 - $3 = $0 this turn: only Bishop's own +1 VP
    expect(game.trash).toEqual(['Estate']);
    expect(game.alice.vpTokens).toBe(1);
  });

  it("lets another player's Market Square react to the card they trash", async () => {
    const game = createGame({ kingdom: ['Bishop', 'Market Square'] });
    game.alice.setHand(['Bishop', 'Estate', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Market Square', 'Estate', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Bishop');
    await game.chooseCard('Estate');
    game.expectDecision('chooseCard', 'Bob');
    await game.chooseCard('Estate');
    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.chooseEffect('Market Square');

    expect(game.trash).toEqual(['Estate', 'Estate']);
    expect(game.bob.discard).toEqual(['Market Square', 'Gold']);
    expect(game.bob.vpTokens).toBe(0);
    expect(game.alice.vpTokens).toBe(2);
    expect(game.pending.playerName).toBe('Alice');
  });
});
