import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';
import { coppers, offered } from './seasideHelpers';

describe('Lookout', () => {
  it('trashes the only card when just one is left, even after shuffling', async () => {
    const game = createGame({ kingdom: ['Lookout'] });
    game.alice.setHand(['Lookout', 'Copper', 'Copper']);
    game.alice.setDeck(['Gold']);

    await game.start();
    await game.playAction('Lookout');

    expect(game.trash).toEqual(['Gold']);
    expect(game.alice.deck).toEqual([]);
    expect(game.alice.discard).toEqual([]);
    expect(game.alice.hand).toEqual(['Copper', 'Copper']);
  });

  it('trashes one card and discards the other when only two are left', async () => {
    const game = createGame({ kingdom: ['Lookout'] });
    game.alice.setHand(['Lookout', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', 'Silver']);

    await game.start();
    await game.playAction('Lookout');
    await game.chooseCard('Estate');

    expect(game.trash).toEqual(['Estate']);
    expect(game.alice.discard).toEqual(['Silver']);
    expect(game.alice.deck).toEqual([]);
  });

  it('does nothing when the deck and discard pile are empty', async () => {
    const game = createGame({ kingdom: ['Lookout'] });
    game.alice.setHand(['Lookout', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Lookout');

    expect(game.trash).toEqual([]);
    expect(game.alice.hand).toEqual(['Copper', 'Copper']);
    expect(game.pending.playerName).toBe('Alice');
  });

  it('shuffles the discard pile into the deck to look at 3 cards', async () => {
    const game = createGame({ kingdom: ['Lookout'] });
    game.alice.setHand(['Lookout', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate']);
    game.alice.setDiscard(['Silver', 'Silver', 'Silver']);

    await game.start();
    await game.playAction('Lookout');
    await game.chooseCard('Estate');

    expect(game.trash).toEqual(['Estate']);
    expect(game.alice.discard).toEqual(['Silver']);
    expect(game.alice.deck).toEqual(['Silver', 'Silver']);
  });

  it('trashes one card and discards the other when one card is in the deck and one in the discard pile', async () => {
    const game = createGame({ kingdom: ['Lookout'] });
    game.alice.setHand(['Lookout', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate']);
    game.alice.setDiscard(['Silver']);

    await game.start();
    await game.playAction('Lookout');
    await game.chooseCard('Estate');

    expect(game.trash).toEqual(['Estate']);
    expect(game.alice.discard).toEqual(['Silver']);
    expect(game.alice.deck).toEqual([]);
  });

  it('lets a discarded Tunnel be revealed to gain a Gold', async () => {
    const game = createGame({ kingdom: ['Lookout', 'Tunnel'] });
    game.alice.setHand(['Lookout', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', 'Tunnel', 'Silver', ...coppers(5)]);

    await game.start();
    await game.playAction('Lookout');
    await game.chooseCard('Estate');
    await game.chooseCard('Tunnel');
    await game.chooseEffect('Tunnel');

    expect(game.trash).toEqual(['Estate']);
    expect(game.alice.discard).toEqual(expect.arrayContaining(['Tunnel', 'Gold']));
    expect(game.alice.deck[0]).toBe('Silver');
  });

  it("doesn't shuffle the looked-at cards into the deck when trashing Cultist draws into a reshuffle", async () => {
    const game = createGame({ kingdom: ['Lookout', 'Cultist'] });
    game.alice.setHand(['Lookout', 'Copper', 'Copper']);
    game.alice.setDeck(['Cultist', 'Estate', 'Silver']);
    game.alice.setDiscard(['Gold', 'Gold', 'Gold']);

    await game.start();
    await game.playAction('Lookout');
    await game.chooseCard('Cultist');

    // Cultist's +3 Cards shuffled only the discard pile
    expect(game.trash).toEqual(['Cultist']);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Gold', 'Gold', 'Gold']);
    await game.chooseCard('Estate');

    expect(game.alice.discard).toEqual(['Estate']);
    expect(game.alice.deck).toEqual(['Silver']);
  });
  it('looks at the card it put back again on its second play by Throne Room', async () => {
    const game = createGame({ kingdom: ['Lookout', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Lookout', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', 'Silver', 'Gold', 'Curse', 'Duchy', ...coppers(5)]);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Lookout');
    await game.chooseCard('Estate');
    await game.chooseCard('Silver');

    // The Gold went back on top, so the second play looks at it again
    expect(offered(game.expectDecision('chooseCard', 'Alice')).sort()).toEqual(['Curse', 'Duchy', 'Gold']);
    await game.chooseCard('Curse');
    await game.chooseCard('Duchy');

    expect(game.trash).toEqual(['Estate', 'Curse']);
    expect(game.alice.discard).toEqual(['Silver', 'Duchy']);
    expect(game.alice.deck[0]).toBe('Gold');
    expect(game.alice.actions).toBe(2);
  });

  it('can trash a Fortress, which goes to hand, and then discards one of the other two', async () => {
    const game = createGame({ kingdom: ['Lookout', 'Fortress'] });
    game.alice.setHand(['Lookout', 'Copper', 'Copper']);
    game.alice.setDeck(['Fortress', 'Estate', 'Silver', ...coppers(5)]);

    await game.start();
    await game.playAction('Lookout');
    await game.chooseCard('Fortress');

    expect(game.trash).toEqual([]);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Fortress']);
    expect(offered(game.expectDecision('chooseCard', 'Alice')).sort()).toEqual(['Estate', 'Silver']);
    await game.chooseCard('Estate');

    expect(game.alice.discard).toEqual(['Estate']);
    expect(game.alice.deck[0]).toBe('Silver');
  });
});
