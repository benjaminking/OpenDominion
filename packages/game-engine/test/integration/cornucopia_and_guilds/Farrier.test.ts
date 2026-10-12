import { CardLocation, CardType, PileCategory } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { CardCollection } from '../../../src/card/CardCollection';
import { Farrier } from '../../../src/cards/cornucopia_and_guilds/Farrier';
import { Pile } from '../../../src/piles/Pile';
import { createGame, GameHarness } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

// Farrier can't be created by name (see the first test), so this adds a Farrier Kingdom pile directly.
const createGameWithFarrierPile = (): GameHarness => {
  const game = createGame({ kingdom: ['Workshop'] });
  const farriers = Array.from({ length: 10 }, (_, index) => {
    const farrier = new Farrier(game.state);
    farrier.setId(`Farrier_pile_${String(index)}`);
    farrier.setLocation(CardLocation.PILE);
    farrier.markAsSupplyCard();
    return farrier;
  });
  game.state.piles.addKingdomPile(
    new Pile(
      'Farrier',
      CardCollection.fromCards(farriers),
      new Set([CardType.ACTION]),
      new Set([PileCategory.KINGDOM, PileCategory.SUPPLY]),
      game.game.getMessageBroadcaster(),
    ),
  );
  return game;
};

// Alice plays her Treasures, buys Farrier and chooses how much to overpay.
const buyFarrier = async (game: GameHarness, overpay: string): Promise<void> => {
  game.alice.setHand(['Gold', 'Gold', 'Copper']);
  game.alice.setDeck(coppers(20));
  await game.start();
  await game.playAllTreasures();
  await game.buy('Farrier');
  if (game.pending.kind === 'chooseFromMultipleEvents') {
    await game.chooseEffect('Farrier');
  }
  await game.chooseOption(overpay);
};

describe('Farrier', () => {
  it('can be in the Kingdom of a real game', () => {
    const game = createGame({ kingdom: ['Farrier'] });

    expect(game.hasPile('Farrier')).toBe(true);
    expect(game.alice.createCard('Farrier').getName()).toBe('Farrier');
  });

  it('overpaying draws 1 extra card per $1 at the end of the turn, after drawing the new hand', async () => {
    const game = createGameWithFarrierPile();

    await buyFarrier(game, '$2');

    expect(game.pending.playerName).toBe('Bob');
    expect(game.alice.hand).toHaveLength(7);
    expect(game.alice.deck).toHaveLength(13);
  });

  it('draws nothing extra when not overpaying', async () => {
    const game = createGameWithFarrierPile();

    await buyFarrier(game, "Don't overpay");

    expect(game.pending.playerName).toBe('Bob');
    expect(game.alice.hand).toHaveLength(5);
  });

  it('cannot be overpaid for when gained without buying it', async () => {
    const game = createGameWithFarrierPile();
    game.alice.setHand(['Workshop', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Workshop');
    await game.chooseCard('Farrier');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.discard).toEqual(['Farrier']);
  });

  it("with a short deck, the extra cards are drawn after shuffling in this turn's discarded cards", async () => {
    const game = createGameWithFarrierPile();
    game.alice.setHand(['Gold', 'Gold', 'Copper']);
    game.alice.setDeck(['Estate', 'Estate', 'Estate', 'Estate', 'Estate']);

    await game.start();
    await game.playAllTreasures();
    await game.buy('Farrier');
    if (game.pending.kind === 'chooseFromMultipleEvents') {
      await game.chooseEffect('Farrier');
    }
    await game.chooseOption('$2');

    expect(game.pending.playerName).toBe('Bob');
    // The new hand is the 5 Estates; the 2 extra cards come from shuffling Farrier, Gold, Gold and Copper
    expect(game.alice.hand).toHaveLength(7);
    expect(game.alice.hand.slice(0, 5)).toEqual(Array<string>(5).fill('Estate'));
    expect(game.alice.deck).toHaveLength(2);
    expect(game.alice.discard).toEqual([]);
    expect([...game.alice.hand.slice(5), ...game.alice.deck].sort()).toEqual(['Copper', 'Farrier', 'Gold', 'Gold']);
  });

  it('two Farriers each overpaid for draw their extra cards separately', async () => {
    const game = createGameWithFarrierPile();
    game.alice.setHand(['Market', 'Gold', 'Gold', 'Copper']);
    game.alice.setDeck(coppers(20));

    await game.start();
    await game.playAction('Market');
    await game.playAllTreasures();
    expect(game.alice.coins).toBe(9);
    await game.buy('Farrier');
    if (game.pending.kind === 'chooseFromMultipleEvents') {
      await game.chooseEffect('Farrier');
    }
    await game.chooseOption('$1');
    await game.buy('Farrier');
    if (game.pending.kind === 'chooseFromMultipleEvents') {
      await game.chooseEffect('Farrier');
    }
    await game.chooseOption('$2');

    expect(game.pending.playerName).toBe('Bob');
    expect(game.alice.hand).toHaveLength(5 + 3);
  });

  it("draws its extra cards on top of Outpost's 3-card hand", async () => {
    const game = createGame({ kingdom: ['Farrier', 'Outpost'] });
    game.alice.setHand(['Outpost', 'Gold', 'Gold', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Outpost');
    await game.playAllTreasures();
    await game.buy('Farrier');
    if (game.pending.kind === 'chooseFromMultipleEvents') {
      await game.chooseEffect('Farrier');
    }
    await game.chooseOption('$2');
    if (game.pending.kind === 'chooseExtraTurns') {
      await game.chooseExtraTurn('Outpost');
    }

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toHaveLength(3 + 2);
  });

  it('overpaying with a Potion draws only for the $ overpaid', async () => {
    const game = createGame({ kingdom: ['Farrier', 'University'] });
    game.alice.setHand(['Potion', 'Gold', 'Copper']);
    game.alice.setDeck(coppers(20));

    await game.start();
    await game.playAllTreasures();
    await game.buy('Farrier');
    if (game.pending.kind === 'chooseFromMultipleEvents') {
      await game.chooseEffect('Farrier');
    }
    expect(game.pending.options).toContain('$1P');
    await game.chooseOption('$1P');

    expect(game.pending.playerName).toBe('Bob');
    expect(game.alice.hand).toHaveLength(5 + 1);
  });

  it('played twice by Throne Room with an empty deck, gives +2 Actions and +2 Buys but draws nothing', async () => {
    const game = createGame({ kingdom: ['Farrier', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Farrier']);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Farrier');

    expect(game.alice.hand).toEqual([]);
    expect(game.alice.actions).toBe(2);
    expect(game.alice.buys).toBe(3);
  });
});
