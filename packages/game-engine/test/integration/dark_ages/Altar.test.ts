import { CardLocation } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const COPPERS = Array<string>(20).fill('Copper');

describe('Altar', () => {
  it('with no other card in hand, trashes nothing but must still gain a card costing up to $5', async () => {
    const game = createGame({ kingdom: ['Altar'] });
    game.alice.setHand(['Altar']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Altar');

    game.expectDecision('chooseCard', 'Alice');
    expect(game.pending.prompt).toBe('Gain a card costing up to $5');
    expect(game.pending.noneAllowed).toBe(false);
    const offered = game.pending.cardChoices.map((choice) => choice.card.name);
    expect(offered).toContain('Duchy');
    expect(offered).not.toContain('Gold');
    expect(offered).not.toContain('Altar');
    await game.chooseCard('Duchy', CardLocation.PILE);

    expect(game.trash).toEqual([]);
    expect(game.alice.discard).toEqual(['Duchy']);
  });

  it('must trash a card when it has one in hand', async () => {
    const game = createGame({ kingdom: ['Altar'] });
    game.alice.setHand(['Altar', 'Gold', 'Gold']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Altar');

    game.expectDecision('chooseCard', 'Alice');
    expect(game.pending.noneAllowed).toBe(false);
    await game.chooseCard('Gold');
    await game.chooseCard('Silver', CardLocation.PILE);

    expect(game.trash).toEqual(['Gold']);
    expect(game.alice.hand).toEqual(['Gold']);
    expect(game.alice.discard).toEqual(['Silver']);
  });
});

describe('Altar: interactions', () => {
  it('trashing a Fortress returns it to hand, and Altar still gains a card', async () => {
    const game = createGame({ kingdom: ['Altar', 'Fortress'] });
    game.alice.setHand(['Altar', 'Fortress', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Altar');
    await game.chooseCard('Fortress');
    await game.chooseCard('Duchy', CardLocation.PILE);

    expect(game.trash).toEqual([]);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Fortress']);
    expect(game.alice.discard).toEqual(['Duchy']);
  });

  it('with Highway in play, can gain a $6 card that now costs $5', async () => {
    const game = createGame({ kingdom: ['Altar', 'Highway'] });
    game.alice.setHand(['Highway', 'Altar', 'Estate', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Highway');
    await game.playAction('Altar');
    await game.chooseCard('Estate');

    const offered = game.pending.cardChoices.map((choice) => choice.card.name);
    expect(offered).toContain('Gold');
    expect(offered).not.toContain('Province');
    await game.chooseCard('Gold', CardLocation.PILE);
    expect(game.alice.discard).toEqual(['Gold']);
  });

  it('trashing a card lets Market Square in hand be discarded for a Gold before Altar gains', async () => {
    const game = createGame({ kingdom: ['Altar', 'Market Square'] });
    game.alice.setHand(['Altar', 'Market Square', 'Estate', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Altar');
    await game.chooseCard('Estate');
    await game.chooseEffect('Market Square');
    game.expectDecision('chooseCard', 'Alice');
    await game.chooseCard('Duchy', CardLocation.PILE);

    expect(game.trash).toEqual(['Estate']);
    expect(game.alice.discard).toEqual(['Market Square', 'Gold', 'Duchy']);
  });

  it('cannot gain a card with a Potion in its cost, but can gain a Potion', async () => {
    const game = createGame({ kingdom: ['Altar', 'Familiar', 'Vineyard'] });
    game.alice.setHand(['Altar', 'Estate', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Altar');
    await game.chooseCard('Estate');

    const offered = game.pending.cardChoices.map((choice) => choice.card.name);
    // Familiar costs $3P and Vineyard $0P: neither is "up to $5"
    expect(offered).not.toContain('Familiar');
    expect(offered).not.toContain('Vineyard');
    expect(offered).toContain('Potion');
    await game.chooseCard('Potion', CardLocation.PILE);
    expect(game.alice.discard).toEqual(['Potion']);
  });

  it('with two Highways and a Bridge in play, can gain the last Province ($5); the game ends after the turn', async () => {
    const game = createGame({ kingdom: ['Altar', 'Highway', 'Bridge'] });
    game.alice.setHand(['Highway', 'Highway', 'Bridge', 'Altar', 'Estate']);
    game.alice.setDeck(['Village', 'Copper', ...COPPERS]);
    game.setPileSize('Province', 1);

    await game.start();
    await game.playAction('Highway');
    await game.playAction('Highway');
    await game.playAction('Village');
    await game.playAction('Bridge');
    expect(game.costOf('Province').coins).toBe(5);
    expect(game.costOf('Estate').coins).toBe(0);
    await game.playAction('Altar');
    await game.chooseCard('Estate');

    const offered = game.pending.cardChoices.map((choice) => choice.card.name);
    expect(offered).toContain('Province');
    expect(offered).not.toContain('Colony');
    await game.chooseCard('Province', CardLocation.PILE);

    expect(game.pileSize('Province')).toBe(0);
    expect(game.isFinished).toBe(false);
    await game.endTurn();
    expect(game.isFinished).toBe(true);
  });

  it('played twice by Coronet in the Buy phase uses Quarry and Peddler costs: Actions cost less, Treasures do not', async () => {
    const game = createGame({ kingdom: ['Altar', 'Quarry', 'Peddler', "King's Court"] });
    game.alice.setHand(['Quarry', 'Coronet', 'Altar', 'Estate', 'Estate']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.endActionPhase();
    await game.playTreasure('Quarry');
    await game.playTreasure('Coronet');
    await game.chooseCard('Altar');
    await game.chooseCard('Estate');

    // Coronet and Altar are Actions in play: Peddler costs $8 - $4 - $2 (Quarry) = $2; King's Court $7 - $2 = $5
    expect(game.costOf('Peddler').coins).toBe(2);
    const offered = game.pending.cardChoices.map((choice) => choice.card.name);
    expect(offered).toContain('Peddler');
    expect(offered).toContain("King's Court");
    expect(offered).not.toContain('Gold');
    expect(offered).not.toContain('Province');
    await game.chooseCard("King's Court", CardLocation.PILE);

    // Second play
    await game.chooseCard('Estate');
    await game.chooseCard('Peddler', CardLocation.PILE);

    expect(game.trash).toEqual(['Estate', 'Estate']);
    expect(game.alice.discard).toEqual(["King's Court", 'Peddler']);
  });
});
