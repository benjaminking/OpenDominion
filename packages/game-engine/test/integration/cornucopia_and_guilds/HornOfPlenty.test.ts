import { describe, expect, it } from 'vitest';

import { HornOfPlenty } from '../../../src/cards/cornucopia_and_guilds/HornOfPlenty';
import { createGame, GameHarness } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

// Horn of Plenty can't be created by name (see the first test), so this puts one into Alice's hand directly.
const addHornOfPlentyToHand = (game: GameHarness): void => {
  const hornOfPlenty = new HornOfPlenty(game.state);
  hornOfPlenty.setId('Alice-HornOfPlenty');
  game.alice.player.getOwnedCards().addCardToHand(hornOfPlenty);
  game.alice.player.getBotStatistics().addCardToStatistics(hornOfPlenty);
};

const offeredNames = (game: GameHarness): string[] => game.pending.cardChoices.map((choice) => choice.card.name);

describe('Horn of Plenty', () => {
  it('can be in the Kingdom of a real game', () => {
    const game = createGame({ kingdom: ['Horn of Plenty'] });

    expect(game.hasPile('Horn of Plenty')).toBe(true);
    expect(game.alice.createCard('Horn of Plenty').getName()).toBe('Horn of Plenty');
  });

  it('counts differently named cards in play, including itself, and is trashed when it gains a Victory card', async () => {
    const game = createGame({ kingdom: ['Village'] });
    game.alice.setHand(['Village', 'Copper', 'Copper', 'Silver']);
    game.alice.setDeck(coppers(10));
    addHornOfPlentyToHand(game);

    await game.start();
    await game.playAction('Village');
    await game.playAllTreasures();
    await game.playTreasure('Horn of Plenty');

    // Village, Copper, Silver, Horn of Plenty: up to $4
    expect(offeredNames(game)).toContain('Smithy');
    expect(offeredNames(game)).not.toContain('Market');
    expect(game.pending.noneAllowed).toBe(false);
    await game.chooseCard('Estate');

    expect(game.alice.discard).toEqual(['Estate']);
    expect(game.trash).toEqual(['Horn of Plenty']);
    expect(game.alice.inPlay).not.toContain('Horn of Plenty');
  });

  it('is not trashed when a Victory card is bought while it is in play', async () => {
    const game = createGame({ kingdom: ['Village'] });
    game.alice.setHand(['Market', 'Gold', 'Copper']);
    game.alice.setDeck(['Copper', ...coppers(10)]);
    addHornOfPlentyToHand(game);

    await game.start();
    await game.playAction('Market');
    await game.playAllTreasures();
    await game.playTreasure('Horn of Plenty');
    await game.chooseCard('Silver');
    await game.buy('Estate');

    expect(game.trash).toEqual([]);
    expect(game.alice.inPlay).toContain('Horn of Plenty');
  });

  it('cannot gain cards from outside the Supply, such as Rewards', async () => {
    const game = createGame({ kingdom: ['Joust'] });
    game.alice.setHand(['Copper', 'Silver', 'Gold']);
    game.alice.setDeck(coppers(10));
    addHornOfPlentyToHand(game);

    await game.start();
    await game.playAllTreasures();
    await game.playTreasure('Horn of Plenty');

    expect(offeredNames(game)).toContain('Silver');
    for (const reward of ['Coronet', 'Courser', 'Demesne', 'Housecarl', 'Huge Turnip', 'Renown']) {
      expect(offeredNames(game)).not.toContain(reward);
    }
  });

  it('is trashed when it gains an Action–Victory card', async () => {
    const game = createGame({ kingdom: ['Horn of Plenty', 'Mill'] });
    game.alice.setHand(['Village', 'Horn of Plenty', 'Copper', 'Silver']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playTreasure('Copper');
    await game.playTreasure('Silver');
    await game.playTreasure('Horn of Plenty');
    // Village, Copper, Silver and Horn of Plenty: up to $4
    await game.chooseCard('Mill');

    expect(game.alice.discard).toEqual(['Mill']);
    expect(game.trash).toEqual(['Horn of Plenty']);
  });

  it('is trashed when it gains a Victory card that Watchtower then trashes', async () => {
    const game = createGame({ kingdom: ['Horn of Plenty', 'Watchtower'] });
    game.alice.setHand(['Horn of Plenty', 'Watchtower', 'Copper', 'Silver']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.endActionPhase();
    await game.playTreasure('Copper');
    await game.playTreasure('Silver');
    await game.playTreasure('Horn of Plenty');
    await game.chooseCard('Estate');
    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Trash it');

    // It still gained a Victory card
    expect(game.trash.sort()).toEqual(['Estate', 'Horn of Plenty']);
  });

  it('played twice by Coronet, loses track of itself once trashed, but still gains a card the second time', async () => {
    const game = createGame({ kingdom: ['Horn of Plenty'] });
    game.alice.setHand(['Village', 'Coronet', 'Horn of Plenty']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Coronet');
    await game.chooseCard('Horn of Plenty');
    await game.chooseCard('Estate');
    expect(game.trash).toEqual(['Horn of Plenty']);
    expect(game.alice.log).not.toContain('Alice has lost track of Horn of Plenty');

    // The second play still gains a card, but can't trash Horn of Plenty again
    await game.chooseCard('Estate');

    expect(game.alice.log).toContain('Alice has lost track of Horn of Plenty');
    expect(game.trash).toEqual(['Horn of Plenty']);
    expect(game.alice.discard).toEqual(['Estate', 'Estate']);
  });

  it('with Bridge in play, can gain a card whose reduced cost fits: 2 names allow a $3 card costing $2', async () => {
    const game = createGame({ kingdom: ['Horn of Plenty', 'Bridge'] });
    game.alice.setHand(['Bridge', 'Horn of Plenty']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Bridge');
    await game.playTreasure('Horn of Plenty');

    // Bridge and Horn of Plenty: up to $2. Silver and Village ($3) cost $2; Smithy ($4) costs $3
    expect(offeredNames(game)).toEqual(expect.arrayContaining(['Silver', 'Village']));
    expect(offeredNames(game)).not.toContain('Smithy');
    await game.chooseCard('Silver');
    expect(game.alice.discard).toEqual(['Silver']);
  });

  it("uses Peddler's Buy-phase cost, which counts the Actions in play", async () => {
    const game = createGame({ kingdom: ['Horn of Plenty', 'Peddler'] });
    game.alice.setHand(['Village', 'Market', 'Festival', 'Horn of Plenty']);
    game.alice.setDeck(['Estate', 'Estate', ...coppers(10)]);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Market');
    await game.playAction('Festival');
    await game.playTreasure('Horn of Plenty');

    // Village, Market, Festival and Horn of Plenty: up to $4. Peddler costs $8 - 3 × $2 = $2
    expect(offeredNames(game)).toContain('Peddler');
    expect(offeredNames(game)).not.toContain('Gold');
    await game.chooseCard('Peddler');
    expect(game.alice.discard).toEqual(['Peddler']);
    expect(game.trash).toEqual([]);
  });

  it('cannot gain a card with a Potion in its cost, even with a Potion in play', async () => {
    const game = createGame({ kingdom: ['Horn of Plenty', 'Alchemist', 'Vineyard'] });
    game.alice.setHand(['Market', 'Potion', 'Copper', 'Silver', 'Gold', 'Horn of Plenty']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Market');
    await game.playTreasure('Potion');
    await game.playTreasure('Copper');
    await game.playTreasure('Silver');
    await game.playTreasure('Gold');
    await game.playTreasure('Horn of Plenty');

    // Market, Potion, Copper, Silver, Gold and Horn of Plenty: up to $6, but no Potion
    expect(offeredNames(game)).toContain('Gold');
    expect(offeredNames(game)).not.toContain('Alchemist');
    expect(offeredNames(game)).not.toContain('Vineyard');
  });
});
