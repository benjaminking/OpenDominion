import { CardLocation } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const COPPERS = Array<string>(20).fill('Copper');

describe('MarketSquare', () => {
  it('may be discarded from hand to gain a Gold when you trash one of your cards', async () => {
    const game = createGame({ kingdom: ['Market Square', 'Junk Dealer'] });
    game.alice.setHand(['Junk Dealer', 'Market Square', 'Estate', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    const golds = game.pileSize('Gold');

    await game.start();
    await game.playAction('Junk Dealer');
    await game.chooseCard('Estate');

    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(game.pending.optionalEffects.map((effect) => effect.effectName)).toEqual(['Market Square']);
    expect(game.pending.mandatoryEffects).toEqual([]);
    await game.chooseEffect('Market Square');

    expect(game.alice.hand).not.toContain('Market Square');
    expect(game.alice.discard).toEqual(['Market Square', 'Gold']);
    expect(game.pileSize('Gold')).toBe(golds - 1);
  });

  it("reacts when another player's Knight trashes one of your cards on their turn", async () => {
    const game = createGame({ players: ['Bob', 'Alice'], kingdom: ['Market Square', 'Knights'] });
    game.bob.setHand(['Sir Martin', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(COPPERS);
    game.alice.setHand(['Market Square', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Sir Martin');

    // Alice reveals Silver and Copper; Silver is the only card costing $3-$6, so it is trashed
    expect(game.trash).toEqual(['Silver']);
    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    await game.chooseEffect('Market Square');

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper']);
    expect(game.alice.discard).toEqual(expect.arrayContaining(['Market Square', 'Gold', 'Copper']));
    expect(game.alice.discard).toHaveLength(3);
  });

  it('is offered when Hovel is trashed for gaining a Victory card', async () => {
    const game = createGame({ kingdom: ['Market Square'] });
    game.alice.setHand(['Hovel', 'Market Square', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.endActionPhase();
    await game.playAllTreasures();
    await game.buy('Estate');
    await game.chooseEffect('Hovel');
    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    await game.chooseEffect('Market Square');

    expect(game.trash).toEqual(['Hovel']);
    expect(game.alice.discard).toEqual(expect.arrayContaining(['Estate', 'Gold', 'Market Square']));
  });

  it('lets you discard several Market Squares when one card is trashed', async () => {
    const game = createGame({ kingdom: ['Market Square', 'Junk Dealer'] });
    game.alice.setHand(['Junk Dealer', 'Market Square', 'Market Square', 'Estate', 'Copper']);
    game.alice.setDeck(COPPERS);
    const golds = game.pileSize('Gold');

    await game.start();
    await game.playAction('Junk Dealer');
    await game.chooseCard('Estate');
    await game.chooseEffect('Market Square');
    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    await game.chooseEffect('Market Square');

    expect(game.alice.hand).not.toContain('Market Square');
    expect(game.alice.discard.filter((name) => name === 'Gold')).toHaveLength(2);
    expect(game.pileSize('Gold')).toBe(golds - 2);
  });

  it("can be resolved before a trashed Cultist's own when-trashed effect", async () => {
    const game = createGame({ kingdom: ['Market Square', 'Junk Dealer', 'Cultist'] });
    game.alice.setHand(['Junk Dealer', 'Market Square', 'Cultist', 'Estate', 'Copper']);
    game.alice.setDeck(['Copper', 'Silver', 'Silver', 'Silver', ...COPPERS]);

    await game.start();
    await game.playAction('Junk Dealer');
    await game.chooseCard('Cultist');

    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(game.pending.optionalEffects.map((effect) => effect.effectName)).toEqual(['Market Square']);
    expect(game.pending.mandatoryEffects.map((effect) => effect.effectName)).toEqual(['Cultist']);
    await game.chooseEffect('Market Square');

    // Market Square: discard it and gain a Gold; then Cultist: +3 Cards
    expect(game.alice.discard).toEqual(['Market Square', 'Gold']);
    expect(game.alice.hand).toEqual(['Estate', 'Copper', 'Copper', 'Silver', 'Silver', 'Silver']);
  });

  it("is not offered when you trash a card that isn't yours (Lurker trashing from the Supply)", async () => {
    const game = createGame({ kingdom: ['Market Square', 'Lurker', 'Village'] });
    game.alice.setHand(['Lurker', 'Market Square', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Lurker');
    await game.chooseOption('Trash an Action card from the Supply');
    await game.chooseCard('Village', CardLocation.PILE);

    expect(game.trash).toEqual(['Village']);
    game.expectDecision('actionPhase', 'Alice');
    expect(game.alice.hand).toContain('Market Square');
  });

  it("can be discarded for a Gold after being drawn by a trashed Cultist's +3 Cards", async () => {
    const game = createGame({ kingdom: ['Market Square', 'Junk Dealer', 'Cultist'] });
    game.alice.setHand(['Junk Dealer', 'Cultist', 'Estate', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Market Square', 'Silver', 'Silver', ...COPPERS]);
    const golds = game.pileSize('Gold');

    await game.start();
    await game.playAction('Junk Dealer');
    await game.chooseCard('Cultist');

    // Cultist's +3 Cards drew the Market Square, which can respond to the same trash
    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(game.pending.optionalEffects.map((effect) => effect.effectName)).toEqual(['Market Square']);
    await game.chooseEffect('Market Square');

    expect(game.alice.hand).toEqual(['Estate', 'Copper', 'Copper', 'Copper', 'Silver', 'Silver']);
    expect(game.alice.discard).toEqual(['Market Square', 'Gold']);
    expect(game.pileSize('Gold')).toBe(golds - 1);
  });
});

describe('MarketSquare: interactions', () => {
  it('can be discarded only once when Chapel trashes 4 cards at once', async () => {
    const game = createGame({ kingdom: ['Market Square', 'Chapel'] });
    game.alice.setHand(['Chapel', 'Market Square', 'Estate', 'Estate', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    const golds = game.pileSize('Gold');

    await game.start();
    await game.playAction('Chapel');
    await game.chooseCards(['Estate', 'Estate', 'Copper', 'Copper']);
    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(game.pending.optionalEffects.map((effect) => effect.effectName)).toEqual(['Market Square']);
    await game.chooseEffect('Market Square');

    expect(game.trash).toEqual(['Estate', 'Estate', 'Copper', 'Copper']);
    expect(game.alice.discard).toEqual(['Market Square', 'Gold']);
    expect(game.pileSize('Gold')).toBe(golds - 1);
    expect(game.pending.kind).not.toBe('chooseFromMultipleEvents');
  });

  it('reacts to a trashed Fortress, which still returns to hand', async () => {
    const game = createGame({ kingdom: ['Market Square', 'Junk Dealer', 'Fortress'] });
    game.alice.setHand(['Junk Dealer', 'Market Square', 'Fortress', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Junk Dealer');
    await game.chooseCard('Fortress');

    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(game.pending.optionalEffects.map((effect) => effect.effectName)).toEqual(['Market Square']);
    expect(game.pending.mandatoryEffects.map((effect) => effect.effectName)).toEqual(['Fortress']);
    await game.chooseEffect('Market Square');

    expect(game.trash).toEqual([]);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Fortress']);
    expect(game.alice.discard).toEqual(['Market Square', 'Gold']);
  });

  it('can still be discarded when the Gold pile is empty, gaining nothing', async () => {
    const game = createGame({ kingdom: ['Market Square', 'Junk Dealer'] });
    game.alice.setHand(['Junk Dealer', 'Market Square', 'Estate', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.setPileSize('Gold', 0);

    await game.start();
    await game.playAction('Junk Dealer');
    await game.chooseCard('Estate');
    await game.chooseEffect('Market Square');

    expect(game.alice.discard).toEqual(['Market Square']);
    expect(game.alice.hand).not.toContain('Market Square');
  });

  it("reacts when another player's Corsair makes you trash the Silver you play", async () => {
    const game = createGame({ kingdom: ['Market Square', 'Corsair'] });
    game.alice.setHand(['Corsair', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Silver', 'Market Square', 'Copper', 'Copper', 'Estate']);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Corsair');
    await game.endTurn();

    await game.endActionPhase();
    await game.playTreasure('Silver');
    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.chooseEffect('Market Square');

    expect(game.trash).toEqual(['Silver']);
    expect(game.bob.coins).toBe(2);
    expect(game.bob.discard).toEqual(['Market Square', 'Gold']);
  });

  it("is not offered when your own Attack trashes another player's card", async () => {
    const game = createGame({ kingdom: ['Market Square', 'Knights'] });
    game.alice.setHand(['Sir Martin', 'Market Square', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Copper', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(['Silver', 'Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Sir Martin');

    expect(game.trash).toEqual(['Silver']);
    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.hand).toContain('Market Square');
  });

  it('is offered when a card of yours is trashed from play (Death Cart trashing itself)', async () => {
    const game = createGame({ kingdom: ['Market Square', 'Death Cart'] });
    game.alice.setHand(['Death Cart', 'Market Square', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Death Cart');
    await game.chooseCard('Death Cart', CardLocation.IN_PLAY);

    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    await game.chooseEffect('Market Square');

    expect(game.trash).toEqual(['Death Cart']);
    expect(game.alice.coins).toBe(5);
    expect(game.alice.discard).toEqual(['Market Square', 'Gold']);
  });

  it('lets each player whose card a Knight trashes respond with their own Market Square, in turn order (3 players)', async () => {
    const game = createGame({ players: ['Alice', 'Bob', 'Cara'], kingdom: ['Market Square', 'Knights'] });
    const cara = game.player('Cara');
    game.alice.setHand(['Sir Martin', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Market Square', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(['Silver', 'Copper', ...COPPERS]);
    cara.setHand(['Market Square', 'Copper', 'Copper', 'Copper', 'Copper']);
    cara.setDeck(['Silver', 'Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Sir Martin');

    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.chooseEffect('Market Square');
    game.expectDecision('chooseFromMultipleEvents', 'Cara');
    await game.declineEffects();

    expect(game.trash).toEqual(['Silver', 'Silver']);
    expect(game.bob.discard).toEqual(expect.arrayContaining(['Market Square', 'Gold']));
    expect(cara.hand).toContain('Market Square');
    expect(cara.discard).not.toContain('Gold');
    game.expectDecision('treasurePhase', 'Alice');
  });

  it('reacts when you trash a card another player passed you with Masquerade, since it is now yours', async () => {
    const game = createGame({ kingdom: ['Market Square', 'Masquerade'] });
    game.alice.setHand(['Masquerade', 'Market Square', 'Estate', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Market Square', 'Curse', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Masquerade');
    await game.chooseCard('Estate');
    await game.chooseCard('Curse');
    await game.chooseCard('Curse');

    // Only Alice, who owned the Curse when it was trashed, may respond
    const decision = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(decision.optionalEffects.map((effect) => effect.effectName)).toEqual(['Market Square']);
    await game.chooseEffect('Market Square');

    expect(game.trash).toEqual(['Curse']);
    expect(game.alice.discard).toEqual(['Market Square', 'Gold']);
    expect(game.bob.hand).toContain('Market Square');
  });
});
