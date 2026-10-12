import { CardLocation } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

describe('Crystal Ball', () => {
  it('can play an Action card from your deck in the Buy phase, and you can play the Treasures it draws', async () => {
    const game = createGame({ kingdom: ['Crystal Ball', 'Smithy'] });
    game.alice.setHand(['Crystal Ball', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(['Smithy', 'Copper', 'Silver', 'Copper', ...coppers(10)]);

    await game.start();
    await game.playTreasure('Crystal Ball');
    expect(game.expectDecision('chooseOneOption', 'Alice').options).toEqual([
      'Trash it',
      'Discard it',
      'Play it',
      'Leave it on top',
    ]);
    await game.chooseOption('Play it');

    expect(game.alice.inPlay).toEqual(['Crystal Ball', 'Smithy']);
    expect(game.alice.hand).toEqual(['Estate', 'Estate', 'Estate', 'Estate', 'Copper', 'Silver', 'Copper']);
    await game.playAllTreasures();
    expect(game.alice.coins).toBe(5);
  });

  it('shuffles your discard pile when your deck is empty, and only offers to play Actions and Treasures', async () => {
    const game = createGame({ kingdom: ['Crystal Ball'] });
    game.alice.setHand(['Crystal Ball', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.alice.setDiscard(['Province']);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playTreasure('Crystal Ball');
    expect(game.expectDecision('chooseOneOption', 'Alice').options).toEqual([
      'Trash it',
      'Discard it',
      'Leave it on top',
    ]);
    await game.chooseOption('Leave it on top');
    await game.endBuyPhase();

    // The Province left on top is drawn in clean-up, before the next shuffle
    expect(game.alice.hand[0]).toBe('Province');
  });

  it('can play a Duration Treasure from the deck, which stays in play and gives its bonus next turn', async () => {
    const game = createGame({ kingdom: ['Crystal Ball', 'Astrolabe'] });
    game.alice.setHand(['Crystal Ball', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(['Astrolabe', ...coppers(20)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playTreasure('Crystal Ball');
    await game.chooseOption('Play it');
    expect(game.alice.coins).toBe(2);
    expect(game.alice.buys).toBe(2);
    await game.endBuyPhase();

    expect(game.alice.inPlay).toEqual(['Astrolabe']);
    await game.endTurn();
    while (game.pending.kind === 'chooseFromMultipleEvents') {
      await game.chooseEffect('Astrolabe');
    }
    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.coins).toBe(1);
    expect(game.alice.buys).toBe(2);
  });

  it('can play a Charlatan Curse from the deck as a Treasure', async () => {
    const game = createGame({ kingdom: ['Crystal Ball', 'Charlatan'] });
    game.alice.setHand(['Crystal Ball', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(['Charlatan Curse', ...coppers(10)]);

    await game.start();
    await game.playTreasure('Crystal Ball');
    expect(game.expectDecision('chooseOneOption', 'Alice').options).toContain('Play it');
    await game.chooseOption('Play it');

    expect(game.alice.coins).toBe(2);
    expect(game.alice.inPlay).toEqual(['Crystal Ball', 'Charlatan Curse']);
  });

  it('looks at the new top card each time when Tiara plays it twice', async () => {
    const game = createGame({ kingdom: ['Crystal Ball', 'Tiara'] });
    game.alice.setHand(['Tiara', 'Crystal Ball', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(['Estate', 'Silver', ...coppers(10)]);

    await game.start();
    await game.playTreasure('Tiara');
    await game.chooseCard('Crystal Ball');
    await game.chooseOption('Discard it');
    expect(game.expectDecision('chooseOneOption', 'Alice').prompt).toContain('Silver');
    await game.chooseOption('Play it');

    expect(game.alice.discard).toEqual(['Estate']);
    expect(game.alice.inPlay).toEqual(['Tiara', 'Crystal Ball', 'Silver']);
    expect(game.alice.coins).toBe(4);
  });

  it('offers to play an Action-Victory Mill and a Treasure-Victory Farm', async () => {
    const game = createGame({ kingdom: ['Crystal Ball', 'Tiara', 'Mill', 'Farm'] });
    game.alice.setHand(['Tiara', 'Crystal Ball', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(['Mill', 'Farm', 'Curse', ...coppers(10)]);

    await game.start();
    await game.playTreasure('Tiara');
    await game.chooseCard('Crystal Ball');
    expect(game.expectDecision('chooseOneOption', 'Alice').options).toContain('Play it');
    await game.chooseOption('Discard it');
    expect(game.expectDecision('chooseOneOption', 'Alice').options).toContain('Play it');
    await game.chooseOption('Play it');

    expect(game.alice.inPlay).toEqual(['Tiara', 'Crystal Ball', 'Farm']);
    expect(game.alice.coins).toBe(4);
  });

  it("doesn't offer to play a Curse when Curses aren't Treasures", async () => {
    const game = createGame({ kingdom: ['Crystal Ball'] });
    game.alice.setHand(['Crystal Ball', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(['Curse', ...coppers(10)]);

    await game.start();
    await game.playTreasure('Crystal Ball');

    expect(game.expectDecision('chooseOneOption', 'Alice').options).toEqual([
      'Trash it',
      'Discard it',
      'Leave it on top',
    ]);
  });

  it('playing an Action that gives +Actions in the Buy phase does not let you play Actions from your hand', async () => {
    const game = createGame({ kingdom: ['Crystal Ball', 'Village', 'Smithy'] });
    game.alice.setHand(['Crystal Ball', 'Smithy', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(['Village', 'Copper', ...coppers(10)]);

    await game.start();
    await game.endActionPhase();
    await game.playTreasure('Crystal Ball');
    await game.chooseOption('Play it');

    expect(game.alice.actions).toBe(3);
    expect(game.alice.hand).toContain('Smithy');
    const handChoices = game
      .expectDecision('treasurePhase', 'Alice')
      .cardChoices.filter((choice) => choice.card.location === CardLocation.HAND)
      .map((choice) => choice.card.name);
    expect(handChoices).toEqual(['Copper']);
  });

  it('discarding a Tunnel from the deck lets you reveal it to gain a Gold', async () => {
    const game = createGame({ kingdom: ['Crystal Ball', 'Tunnel'] });
    game.alice.setHand(['Crystal Ball', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(['Tunnel', ...coppers(10)]);

    await game.start();
    await game.playTreasure('Crystal Ball');
    await game.chooseOption('Discard it');
    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    await game.chooseEffect('Tunnel');

    expect(game.alice.discard).toEqual(['Tunnel', 'Gold']);
  });

  it("only looks at the top card: other players don't see a card left on top", async () => {
    const game = createGame({ kingdom: ['Crystal Ball'] });
    game.alice.setHand(['Crystal Ball', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(['Province', ...coppers(10)]);

    await game.start();
    await game.playTreasure('Crystal Ball');
    await game.chooseOption('Leave it on top');

    expect(game.alice.deck[0]).toBe('Province');
    expect(game.bob.log.filter((line) => line.includes('Province'))).toEqual([]);
  });
});
