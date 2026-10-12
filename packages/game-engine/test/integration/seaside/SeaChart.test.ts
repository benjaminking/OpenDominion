import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';
import { coppers } from './seasideHelpers';

describe('Sea Chart', () => {
  it('puts a revealed copy of itself into hand', async () => {
    const game = createGame({ kingdom: ['Sea Chart'] });
    game.alice.setHand(['Sea Chart', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', 'Sea Chart', ...coppers(10)]);

    await game.start();
    await game.playAction('Sea Chart');

    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Silver', 'Sea Chart']);
    expect(game.alice.actions).toBe(1);
  });

  it('leaves the revealed card on top of the deck when no copy of it is in play', async () => {
    const game = createGame({ kingdom: ['Sea Chart'] });
    game.alice.setHand(['Sea Chart', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', 'Gold', ...coppers(10)]);

    await game.start();
    await game.playAction('Sea Chart');

    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Silver']);
    expect(game.alice.deck[0]).toBe('Gold');
  });

  it('puts the revealed card into hand when a copy of it is a Duration still in play from the previous turn', async () => {
    const game = createGame({ kingdom: ['Sea Chart', 'Caravan'] });
    game.alice.setHand(['Caravan', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck([
      'Copper',
      'Sea Chart',
      'Copper',
      'Copper',
      'Copper',
      'Copper',
      'Copper',
      'Copper',
      'Caravan',
      ...coppers(10),
    ]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Caravan');
    await game.endTurn();
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.inPlay).toEqual(['Caravan']);
    await game.playAction('Sea Chart');

    expect(game.alice.hand).toContain('Caravan');
    expect(game.alice.deck).toEqual(coppers(10));
  });

  it('leaves the revealed card on the deck just once when no copy of it is in play', async () => {
    const game = createGame({ kingdom: ['Sea Chart'] });
    game.alice.setHand(['Sea Chart', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', 'Gold', 'Estate', 'Copper', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Sea Chart');

    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Silver']);
    expect(game.alice.deck).toEqual(['Gold', 'Estate', 'Copper', 'Copper', 'Copper']);
  });

  it('counts a card it put into hand only once for scoring', async () => {
    const game = createGame({ kingdom: ['Sea Chart', 'Nobles'] });
    game.alice.setHand(['Nobles', 'Sea Chart', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Nobles', ...coppers(10)]);
    game.bob.setHand(coppers(5));
    game.setPileSize('Province', 0);

    await game.start();
    await game.playAction('Nobles');
    await game.chooseOption('+2 Actions');
    await game.playAction('Sea Chart');
    expect(game.alice.hand).toContain('Nobles');

    // Two Nobles at 2 VP each
    expect(game.alice.score).toBe(4);
    await game.endTurn();

    expect(game.isFinished).toBe(true);
    expect(game.alice.score).toBe(4);
  });
  it('shuffles the discard pile to reveal a card when its draw emptied the deck', async () => {
    const game = createGame({ kingdom: ['Sea Chart', 'Village'] });
    game.alice.setHand(['Village', 'Sea Chart', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', 'Gold']);
    game.alice.setDiscard(['Village', 'Village']);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Sea Chart');

    // A Village is in play, so the revealed Village goes into hand
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Estate', 'Gold', 'Village']);
    expect(game.alice.deck).toEqual(['Village']);
    expect(game.alice.discard).toEqual([]);
  });

  it('reveals nothing when there is no card left after its draw', async () => {
    const game = createGame({ kingdom: ['Sea Chart'] });
    game.alice.setHand(['Sea Chart', 'Copper']);
    game.alice.setDeck(['Gold']);

    await game.start();
    await game.playAction('Sea Chart');

    expect(game.alice.hand).toEqual(['Copper', 'Gold']);
    expect(game.alice.actions).toBe(1);
    expect(game.alice.deck).toEqual([]);
    expect(game.pending.playerName).toBe('Alice');
  });
});
