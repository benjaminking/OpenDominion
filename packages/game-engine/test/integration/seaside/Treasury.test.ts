import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';
import { coppers, offeredEffects, resolveEffects } from './seasideHelpers';

describe('Treasury', () => {
  it('may be put onto the deck when discarded from play if no Victory card was gained', async () => {
    const game = createGame({ kingdom: ['Treasury'] });
    game.alice.setHand(['Treasury', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));

    await game.start();
    await game.playAction('Treasury');
    await game.playAllTreasures();
    await game.buy('Silver');

    const topdeck = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(topdeck.optionalEffects.map((effect) => effect.effectName)).toEqual(['Treasury']);
    await game.chooseEffect('Treasury');

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.hand).toContain('Treasury');
    expect(game.alice.discard).not.toContain('Treasury');
  });

  it('lets its owner put some but not all of several Treasuries onto the deck', async () => {
    const game = createGame({ kingdom: ['Treasury'] });
    game.alice.setHand(['Treasury', 'Treasury', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));

    await game.start();
    await game.playAction('Treasury');
    await game.playAction('Treasury');
    await game.playAllTreasures();
    await game.buy('Silver');
    await game.chooseEffect('Treasury');
    await game.declineEffects();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.hand.filter((name) => name === 'Treasury')).toHaveLength(1);
    expect(game.alice.discard.filter((name) => name === 'Treasury')).toHaveLength(1);
  });

  it('is discarded normally when a Victory card was gained in the Buy phase', async () => {
    const game = createGame({ kingdom: ['Treasury'] });
    game.alice.setHand(['Treasury', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));

    await game.start();
    await game.playAction('Treasury');
    await game.playAllTreasures();
    await game.buy('Estate');

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.discard).toContain('Treasury');
    expect(game.alice.hand).not.toContain('Treasury');
  });

  it('may still be put onto the deck when the only Victory card was gained outside the Buy phase', async () => {
    const game = createGame({ kingdom: ['Treasury', 'Workshop'] });
    game.alice.setHand(['Treasury', 'Workshop', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));

    await game.start();
    await game.playAction('Treasury');
    await game.playAction('Workshop');
    await game.chooseCard('Estate');
    await game.endTurn();

    const topdeck = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(topdeck.optionalEffects.map((effect) => effect.effectName)).toEqual(['Treasury']);
  });

  it('is not put onto the deck when discarded from hand', async () => {
    const game = createGame({ kingdom: ['Treasury', 'Warehouse'] });
    game.alice.setHand(['Warehouse', 'Treasury', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));

    await game.start();
    await game.playAction('Warehouse');
    await game.chooseCards(['Treasury', 'Copper', 'Copper']);

    expect(game.pending.kind).not.toBe('chooseFromMultipleEvents');
    expect(game.alice.discard).toContain('Treasury');
  });

  it('can be put onto the deck at the end of a turn with Outpost, so it is in the 3-card hand of the extra turn', async () => {
    const game = createGame({ kingdom: ['Treasury', 'Outpost'] });
    game.alice.setHand(['Treasury', 'Outpost', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', ...coppers(20)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Treasury');
    await game.playAction('Outpost');
    await game.playAllTreasures();
    await game.buy('Silver');
    await game.chooseEffect('Treasury');
    await game.chooseExtraTurn('Outpost');
    await resolveEffects(game);

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toEqual(['Treasury', 'Copper', 'Copper']);
  });
  it.each(['Island', 'Nobles', 'Mill', 'Farm'])(
    'is discarded normally when a multi-type Victory card (%s) was bought',
    async (victoryCard) => {
      const game = createGame({ kingdom: ['Treasury', victoryCard] });
      game.alice.setHand(['Treasury', 'Gold', 'Gold', 'Copper', 'Copper']);
      game.alice.setDeck(coppers(20));

      await game.start();
      await game.playAction('Treasury');
      await game.playAllTreasures();
      await game.buy(victoryCard);

      expect(game.currentPlayerName).toBe('Bob');
      expect(game.alice.discard).toEqual(expect.arrayContaining(['Treasury', victoryCard]));
      expect(game.alice.hand).not.toContain('Treasury');
    },
  );

  it('is discarded normally when a Victory card was gained in the Buy phase without being bought, e.g. by Border Village', async () => {
    const game = createGame({ kingdom: ['Treasury', 'Border Village'] });
    game.alice.setHand(['Treasury', 'Gold', 'Silver', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));

    await game.start();
    await game.playAction('Treasury');
    await game.playAllTreasures();
    await game.buy('Border Village');
    await game.chooseCard('Estate');

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.discard).toEqual(expect.arrayContaining(['Treasury', 'Border Village', 'Estate']));
  });

  it('is discarded normally when a Treasure gained a Victory card while Treasures were being played', async () => {
    const game = createGame({ kingdom: ['Treasury', 'Horn of Plenty'] });
    game.alice.setHand(['Treasury', 'Horn of Plenty', 'Gold', 'Silver']);
    game.alice.setDeck(['Copper', ...coppers(20)]);

    await game.start();
    await game.playAction('Treasury');
    await game.playTreasure('Copper');
    await game.playTreasure('Silver');
    await game.playTreasure('Gold');
    // 5 differently named cards in play: gain a Duchy, trashing Horn of Plenty
    await game.playTreasure('Horn of Plenty');
    await game.chooseCard('Duchy');
    expect(game.trash).toEqual(['Horn of Plenty']);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.discard).toEqual(expect.arrayContaining(['Treasury', 'Duchy']));
  });

  it('is discarded normally when the Victory card bought was then trashed with Watchtower', async () => {
    const game = createGame({ kingdom: ['Treasury', 'Watchtower'] });
    game.alice.setHand(['Treasury', 'Watchtower', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));

    await game.start();
    await game.playAction('Treasury');
    await game.endActionPhase();
    await game.playAllTreasures();
    await game.buy('Estate');
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Trash it');

    expect(game.trash).toEqual(['Estate']);
    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.discard).toContain('Treasury');
  });

  it('only looks at the current turn: a Victory card bought before an Outpost turn does not stop it then', async () => {
    const game = createGame({ kingdom: ['Treasury', 'Outpost'] });
    game.alice.setHand(['Outpost', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Treasury', 'Copper', 'Copper', ...coppers(20)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Outpost');
    await game.playAllTreasures();
    await game.buy('Estate');
    await game.chooseExtraTurn('Outpost');
    await resolveEffects(game);

    expect(game.currentPlayerName).toBe('Alice');
    await game.playAction('Treasury');
    await game.playAllTreasures();
    await game.buy('Silver');

    expect(offeredEffects(game.expectDecision('chooseFromMultipleEvents', 'Alice'))).toEqual(['Treasury']);
    await game.chooseEffect('Treasury');
    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.hand).toContain('Treasury');
  });

  it('can be put onto the deck only once when played twice by Throne Room', async () => {
    const game = createGame({ kingdom: ['Treasury', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Treasury', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Treasury');
    expect(game.alice.coins).toBe(2);
    await game.playAllTreasures();
    await game.buy('Silver');

    expect(offeredEffects(game.expectDecision('chooseFromMultipleEvents', 'Alice'))).toEqual(['Treasury']);
    await game.chooseEffect('Treasury');

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.hand.filter((name) => name === 'Treasury')).toHaveLength(1);
    expect(game.alice.discard).toContain('Throne Room');
  });
});
