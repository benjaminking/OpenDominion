import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

describe('ShantyTown', () => {
  it('counts an Action-Victory card in hand as an Action card', async () => {
    const game = createGame({ kingdom: ['Shanty Town', 'Nobles'] });
    game.alice.setHand(['Shanty Town', 'Nobles', 'Estate', 'Copper']);
    game.alice.setDeck(Array<string>(10).fill('Gold'));

    await game.start();
    await game.playAction('Shanty Town');

    expect(game.alice.actions).toBe(2);
    expect(game.alice.hand).toEqual(['Nobles', 'Estate', 'Copper']);
  });

  it('draws 2 cards from an empty hand', async () => {
    const game = createGame({ kingdom: ['Shanty Town'] });
    game.alice.setHand(['Shanty Town']);
    game.alice.setDeck(['Gold', 'Silver', 'Copper']);

    await game.start();
    await game.playAction('Shanty Town');

    expect(game.alice.hand).toEqual(['Gold', 'Silver']);
  });

  it('reveals the hand again for the second play by Throne Room', async () => {
    const game = createGame({ kingdom: ['Shanty Town', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Shanty Town', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Village', 'Copper', 'Gold', 'Gold', ...Array<string>(10).fill('Copper')]);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Shanty Town');

    // The first play drew a Village, so the second play draws nothing
    expect(game.alice.actions).toBe(4);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Village', 'Copper']);
  });

  it('does not draw with a Treasure-Action card (Coronet) in hand', async () => {
    const game = createGame({ kingdom: ['Shanty Town'] });
    game.alice.setHand(['Shanty Town', 'Coronet', 'Copper']);
    game.alice.setDeck(coppers(5));

    await game.start();
    await game.playAction('Shanty Town');

    expect(game.alice.hand).toEqual(['Coronet', 'Copper']);
    expect(game.alice.actions).toBe(2);
  });

  it('draws with only a Treasure-Victory card (Farm) and Treasures in hand', async () => {
    const game = createGame({ kingdom: ['Shanty Town', 'Farm'] });
    game.alice.setHand(['Shanty Town', 'Farm', 'Copper']);
    game.alice.setDeck(['Gold', 'Silver', 'Copper']);

    await game.start();
    await game.playAction('Shanty Town');

    expect(game.alice.hand).toEqual(['Farm', 'Copper', 'Gold', 'Silver']);
  });

  it('draws only the card left when the deck and discard pile hold 1 card', async () => {
    const game = createGame({ kingdom: ['Shanty Town'] });
    game.alice.setHand(['Shanty Town', 'Copper']);
    game.alice.setDeck([]);
    game.alice.setDiscard(['Gold']);

    await game.start();
    await game.playAction('Shanty Town');

    expect(game.alice.hand).toEqual(['Copper', 'Gold']);
    expect(game.alice.actions).toBe(2);
  });

  it.each([
    { card: 'Hovel', draws: true },
    { card: 'Necropolis', draws: false },
    { card: 'Ruined Village', draws: false },
    { card: "Fool's Gold", draws: true },
    { card: 'Tunnel', draws: true },
  ])('treats $card in hand by its Action type (draws: $draws)', async ({ card, draws }) => {
    const game = createGame({ kingdom: ['Shanty Town', 'Cultist', "Fool's Gold", 'Tunnel'], useShelters: true });
    game.alice.setHand(['Shanty Town', card]);
    game.alice.setDeck(['Gold', 'Gold', ...coppers(5)]);

    await game.start();
    await game.playAction('Shanty Town');

    expect(game.alice.hand).toEqual(draws ? [card, 'Gold', 'Gold'] : [card]);
  });
});
