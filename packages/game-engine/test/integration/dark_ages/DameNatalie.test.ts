import { CardLocation } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const COPPERS = Array<string>(10).fill('Copper');

describe('Dame Natalie', () => {
  it('gains before attacking, and may decline to gain', async () => {
    const game = createGame({ kingdom: ['Knights', 'Village', 'Smithy'] });
    game.alice.setHand(['Dame Natalie', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(['Silver', 'Gold', ...COPPERS]);

    await game.start();
    await game.playAction('Dame Natalie');

    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(gain.noneAllowed).toBe(true);
    const offered = gain.cardChoices.map((choice) => choice.card.name);
    expect(offered).toEqual(expect.arrayContaining(['Copper', 'Silver', 'Estate', 'Village']));
    expect(offered).not.toContain('Smithy');
    await game.chooseNone();

    game.expectDecision('chooseCard', 'Bob');
    await game.chooseCard('Gold');
    expect(game.alice.discard).toEqual([]);
    expect(game.trash).toEqual(['Gold']);
  });

  it('can gain a $4 card while Bridge makes it cost $3', async () => {
    const game = createGame({ kingdom: ['Knights', 'Village', 'Bridge', 'Smithy'] });
    game.alice.setHand(['Village', 'Bridge', 'Dame Natalie', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Bridge');
    await game.playAction('Dame Natalie');

    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(gain.cardChoices.map((choice) => choice.card.name)).toContain('Smithy');
    await game.chooseCard('Smithy', CardLocation.PILE);

    expect(game.alice.discard).toEqual(['Smithy']);
  });

  it('cannot gain a card with a Potion in its cost', async () => {
    const game = createGame({ kingdom: ['Knights', 'University', 'Vineyard', 'Herbalist'] });
    game.alice.setHand(['Dame Natalie', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Dame Natalie');

    const gain = game.expectDecision('chooseCard', 'Alice');
    const offered = gain.cardChoices.map((choice) => choice.card.name);
    expect(offered).toEqual(expect.arrayContaining(['Herbalist', 'Silver', 'Estate']));
    expect(offered).not.toContain('University');
    expect(offered).not.toContain('Vineyard');
    expect(offered).not.toContain('Potion');
    await game.chooseCard('Herbalist');

    expect(game.alice.discard).toEqual(['Herbalist']);
  });

  it('can gain Sir Martin from the top of the Knights pile while Bridge makes it cost $3, but no other Knight', async () => {
    const game = createGame({ kingdom: ['Knights', 'Village', 'Bridge'] });
    game.setPile('Knights', ['Sir Martin', 'Sir Destry']);
    game.alice.setHand(['Village', 'Bridge', 'Dame Natalie', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Bridge');
    await game.playAction('Dame Natalie');

    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(gain.cardChoices.filter((choice) => choice.card.name.startsWith('Sir'))).toHaveLength(1);
    await game.chooseCard('Sir Martin', CardLocation.PILE);

    expect(game.alice.discard).toEqual(['Sir Martin']);
    expect(game.pileCards('Knights')).toEqual(['Sir Destry']);
  });

  it('uses stacked cost reductions: with Bridge and Highway in play a $5 card is offered but a $6 card is not', async () => {
    const game = createGame({ kingdom: ['Knights', 'Village', 'Bridge', 'Highway', 'Laboratory'] });
    game.alice.setHand(['Village', 'Highway', 'Bridge', 'Dame Natalie', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Highway');
    await game.playAction('Bridge');
    await game.playAction('Dame Natalie');

    const gain = game.expectDecision('chooseCard', 'Alice');
    const offered = gain.cardChoices.map((choice) => choice.card.name);
    expect(offered).toContain('Laboratory');
    expect(offered).toContain('Duchy');
    expect(offered).not.toContain('Gold');
    await game.chooseCard('Laboratory', CardLocation.PILE);

    expect(game.alice.discard).toEqual(['Laboratory']);
  });

  it("can gain a Peddler when Coronet plays it in the Buy phase with 3 Actions in play (Peddler's Buy-phase cost is $2)", async () => {
    const game = createGame({ kingdom: ['Knights', 'Village', 'Peddler'] });
    game.alice.setHand(['Village', 'Coronet', 'Dame Natalie', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Village');
    await game.endActionPhase();
    await game.playTreasure('Coronet');
    await game.chooseCard('Dame Natalie');

    // Village, Coronet and Dame Natalie are Actions in play
    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(gain.cardChoices.map((choice) => choice.card.name)).toContain('Peddler');
    await game.chooseCard('Peddler');
    // Second play: gain nothing this time
    await game.chooseNone();
    // Coronet: no Treasure to play twice
    await game.chooseNone();

    game.expectDecision(['treasurePhase', 'buyPhase'], 'Alice');
    expect(game.alice.discard).toEqual(['Peddler']);
  });

  it('does not offer cards from non-Supply piles, and offers only the top card of the Ruins pile', async () => {
    const game = createGame({ kingdom: ['Knights', 'Pillage', 'Hermit', 'Urchin', 'Cultist'] });
    game.setPile('Ruins', ['Ruined Market', 'Survivors', 'Ruined Village']);
    game.alice.setHand(['Dame Natalie', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Dame Natalie');

    const gain = game.expectDecision('chooseCard', 'Alice');
    const offered = gain.cardChoices.map((choice) => choice.card.name);
    expect(offered).toContain('Ruined Market');
    expect(offered).not.toContain('Survivors');
    expect(offered).not.toContain('Ruined Village');
    expect(offered).not.toContain('Spoils');
    expect(offered).not.toContain('Madman');
    expect(offered).not.toContain('Mercenary');
    await game.chooseCard('Ruined Market');

    expect(game.alice.discard).toEqual(['Ruined Market']);
    expect(game.pileCards('Ruins')).toEqual(['Survivors', 'Ruined Village']);
  });

  it('can gain the last card of a third pile; the attack still happens and the game ends only after the turn', async () => {
    const game = createGame({ kingdom: ['Knights', 'Village', 'Smithy', 'Workshop'] });
    game.setPileSize('Village', 0);
    game.setPileSize('Smithy', 0);
    game.setPileSize('Workshop', 1);
    game.alice.setHand(['Dame Natalie', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(['Silver', 'Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Dame Natalie');
    await game.chooseCard('Workshop');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.pileSize('Workshop')).toBe(0);
    expect(game.trash).toEqual(['Silver']);
    expect(game.isFinished).toBe(false);

    await game.playAllTreasures();
    await game.buy('Silver');
    expect(game.isFinished).toBe(true);
    expect(game.alice.discard).toEqual(expect.arrayContaining(['Workshop', 'Silver']));
  });
});
