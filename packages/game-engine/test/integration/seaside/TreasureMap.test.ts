import { CardLocation } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';
import { coppers } from './seasideHelpers';

describe('Treasure Map', () => {
  it('gains 4 Golds only once when played twice by Throne Room with exactly one other Treasure Map in hand', async () => {
    const game = createGame({ kingdom: ['Treasure Map', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Treasure Map', 'Treasure Map', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', ...coppers(10)]);
    const golds = game.pileSize('Gold');

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Treasure Map');
    await game.chooseCard('Treasure Map');

    expect(game.trash).toEqual(['Treasure Map', 'Treasure Map']);
    expect(game.alice.deck.slice(0, 5)).toEqual(['Gold', 'Gold', 'Gold', 'Gold', 'Estate']);
    expect(game.pileSize('Gold')).toBe(golds - 4);
    expect(game.alice.inPlay).toEqual(['Throne Room']);
  });

  it("gains no Golds on Throne Room's second play, when the played Treasure Map is already in the trash", async () => {
    const game = createGame({ kingdom: ['Treasure Map', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Treasure Map', 'Treasure Map', 'Treasure Map', 'Copper']);
    game.alice.setDeck(coppers(10));
    const golds = game.pileSize('Gold');

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Treasure Map');
    await game.chooseCard('Treasure Map');
    await game.chooseCard('Treasure Map');

    // The second play can't trash the played Treasure Map, but still trashes the one from hand
    expect(game.alice.log).toContain('Alice has lost track of Treasure Map');
    expect(game.trash).toEqual(['Treasure Map', 'Treasure Map', 'Treasure Map']);
    expect(game.pileSize('Gold')).toBe(golds - 4);
  });

  it('gains nothing when played twice by Throne Room with no other Treasure Map in hand', async () => {
    const game = createGame({ kingdom: ['Treasure Map', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Treasure Map', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    const golds = game.pileSize('Gold');

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Treasure Map');

    expect(game.trash).toEqual(['Treasure Map']);
    expect(game.pileSize('Gold')).toBe(golds);
  });

  it('gains only the Golds left in the Supply', async () => {
    const game = createGame({ kingdom: ['Treasure Map'] });
    game.alice.setHand(['Treasure Map', 'Treasure Map', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', ...coppers(10)]);
    game.setPileSize('Gold', 2);

    await game.start();
    await game.playAction('Treasure Map');
    await game.chooseCard('Treasure Map');

    expect(game.pileSize('Gold')).toBe(0);
    expect(game.alice.deck.slice(0, 3)).toEqual(['Gold', 'Gold', 'Estate']);
  });

  it('trashes only one of two other Treasure Maps in hand, keeping the other', async () => {
    const game = createGame({ kingdom: ['Treasure Map'] });
    game.alice.setHand(['Treasure Map', 'Treasure Map', 'Treasure Map', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', ...coppers(10)]);

    await game.start();
    await game.playAction('Treasure Map');
    const secondMap = game.expectDecision('chooseCard', 'Alice');
    expect(secondMap.cardChoices).toHaveLength(2);
    expect(secondMap.noneAllowed).toBe(false);
    await game.chooseCard('Treasure Map');

    expect(game.trash).toEqual(['Treasure Map', 'Treasure Map']);
    expect(game.alice.hand).toEqual(['Treasure Map', 'Copper', 'Copper']);
    expect(game.alice.deck.slice(0, 5)).toEqual(['Gold', 'Gold', 'Gold', 'Gold', 'Estate']);
  });

  it('leaves the Treasure Map in the Supply and gains no Golds when played by Band of Misfits', async () => {
    const game = createGame({ kingdom: ['Treasure Map', 'Band Of Misfits'] });
    game.alice.setHand(['Band Of Misfits', 'Treasure Map', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    const maps = game.pileSize('Treasure Map');
    const golds = game.pileSize('Gold');

    await game.start();
    await game.playAction('Band Of Misfits');
    await game.chooseCard('Treasure Map');
    await game.chooseCard('Treasure Map', CardLocation.HAND);

    // Only the Treasure Map from hand could be trashed
    expect(game.alice.log).toContain('Alice has lost track of Treasure Map');
    expect(game.trash).toEqual(['Treasure Map']);
    expect(game.pileSize('Treasure Map')).toBe(maps);
    expect(game.pileSize('Gold')).toBe(golds);
    expect(game.alice.inPlay).toEqual(['Band Of Misfits']);
  });
  it('still trashes both Treasure Maps when the Gold pile is empty', async () => {
    const game = createGame({ kingdom: ['Treasure Map'] });
    game.alice.setHand(['Treasure Map', 'Treasure Map', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', ...coppers(10)]);
    game.setPileSize('Gold', 0);

    await game.start();
    await game.playAction('Treasure Map');
    await game.chooseCard('Treasure Map');

    expect(game.trash).toEqual(['Treasure Map', 'Treasure Map']);
    expect(game.alice.deck[0]).toBe('Estate');
  });

  it('gains 4 Golds when played by Vassal from the discard pile with another Treasure Map in hand', async () => {
    const game = createGame({ kingdom: ['Treasure Map', 'Vassal'] });
    game.alice.setHand(['Vassal', 'Treasure Map', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Treasure Map', 'Estate', ...coppers(10)]);

    await game.start();
    await game.playAction('Vassal');
    await game.chooseOption('Yes');
    await game.chooseCard('Treasure Map');

    expect(game.trash).toEqual(['Treasure Map', 'Treasure Map']);
    expect(game.alice.deck.slice(0, 5)).toEqual(['Gold', 'Gold', 'Gold', 'Gold', 'Estate']);
    expect(game.alice.inPlay).toEqual(['Vassal']);
  });
});
