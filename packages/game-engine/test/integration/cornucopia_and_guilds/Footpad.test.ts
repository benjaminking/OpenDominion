import { CardInfoLookup } from '@dominion/card-info';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createGame } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

describe('Footpad', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('in games using it, Remake turning two Estates into two Silvers draws two cards', async () => {
    const game = createGame({ kingdom: ['Footpad', 'Remake'] });
    game.alice.setHand(['Remake', 'Estate', 'Estate']);
    game.alice.setDeck(['Gold', 'Gold', ...coppers(10)]);

    await game.start();
    await game.playAction('Remake');
    await game.chooseCard('Estate');
    await game.chooseCard('Silver');
    expect(game.alice.hand).toEqual(['Estate', 'Gold']);
    await game.chooseCard('Estate');
    await game.chooseCard('Silver');

    expect(game.alice.hand).toEqual(['Gold', 'Gold']);
    expect(game.alice.discard).toEqual(['Silver', 'Silver']);
  });

  it('in games using it, gaining cards in the Buy phase draws nothing', async () => {
    const game = createGame({ kingdom: ['Footpad'] });
    game.alice.setHand(['Market', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Market');
    await game.playAllTreasures();
    await game.buy('Silver');

    game.expectDecision('buyPhase', 'Alice');
    expect(game.alice.hand).toEqual([]);
  });

  it('in games using it, a Courser gaining 4 Silvers in the Action phase draws 4 cards', async () => {
    const game = createGame({ kingdom: ['Footpad'] });
    game.alice.setHand(['Courser']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Courser');
    await game.chooseOptions(['+$2', 'Gain 4 Silvers']);

    expect(game.alice.hand).toEqual(coppers(4));
    expect(game.alice.discard).toEqual(['Silver', 'Silver', 'Silver', 'Silver']);
  });

  it('makes each other player discard down to 3, skipping players with 3 or fewer cards', async () => {
    const game = createGame({ kingdom: ['Footpad'], players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['Footpad', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Estate', 'Estate', 'Copper', 'Copper', 'Silver']);
    game.player('Cara').setHand(['Estate', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Footpad');
    game.expectDecision('chooseCards', 'Bob');
    await game.chooseCards(['Estate', 'Estate']);

    expect(game.bob.hand).toEqual(['Copper', 'Copper', 'Silver']);
    expect(game.player('Cara').hand).toHaveLength(3);
    expect(game.pending.playerName).toBe('Alice');
    expect(game.alice.coffers).toBe(2);
  });

  it("in games using it, a player gaining a card in another player's Action phase draws a card", async () => {
    // Young Witch's Bane is Hamlet
    const findMatchingRandomizerName = CardInfoLookup.findMatchingRandomizerName.bind(CardInfoLookup);
    vi.spyOn(CardInfoLookup, 'findMatchingRandomizerName').mockImplementation((requirements, usedCardNames) =>
      requirements?.requiredCoinCosts?.join() === '2,3'
        ? 'Hamlet'
        : findMatchingRandomizerName(requirements, usedCardNames),
    );
    const game = createGame({ kingdom: ['Footpad', 'Young Witch'] });
    game.alice.setHand(['Young Witch', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', 'Estate', ...coppers(10)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(['Silver', ...coppers(5)]);

    await game.start();
    await game.playAction('Young Witch');
    await game.chooseCards(['Estate', 'Estate']);

    expect(game.bob.discard).toEqual(['Curse']);
    expect(game.bob.hand).toEqual([...coppers(5), 'Silver']);
    expect(game.bob.deck).toEqual(coppers(5));
  });

  it("a player reacting to it with Beggar draws for both Silvers, as it is the attacker's Action phase, then discards down to 3", async () => {
    const game = createGame({ kingdom: ['Footpad', 'Beggar'] });
    game.alice.setHand(['Footpad', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Beggar', 'Estate', 'Estate', 'Copper', 'Copper']);
    game.bob.setDeck(['Gold', ...coppers(5)]);

    await game.start();
    await game.playAction('Footpad');
    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.chooseEffect('Beggar');
    while (game.pending.kind === 'chooseFromMultipleEvents') {
      await game.declineEffects();
    }

    // The Silver gained onto the deck is drawn, then the next card (Gold) for the other Silver
    expect(game.bob.hand).toEqual(['Estate', 'Estate', 'Copper', 'Copper', 'Silver', 'Gold']);
    game.expectDecision('chooseCards', 'Bob');
    await game.chooseCards(['Estate', 'Estate', 'Copper']);

    expect(game.bob.hand).toEqual(['Copper', 'Silver', 'Gold']);
    expect(game.bob.discard).toEqual(['Beggar', 'Silver', 'Estate', 'Estate', 'Copper']);
  });

  it('with 3 players, each gain draws exactly one card, whoever gains it', async () => {
    const game = createGame({ kingdom: ['Footpad', 'Soothsayer'], players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['Soothsayer', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', ...coppers(10)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(['Gold', 'Silver', 'Estate', ...coppers(5)]);
    game.player('Cara').setHand(coppers(5));
    game.player('Cara').setDeck(['Gold', 'Silver', 'Estate', ...coppers(5)]);

    await game.start();
    await game.playAction('Soothsayer');

    // Alice: +1 Card for the Gold. Bob and Cara: +1 Card for the Curse, then Soothsayer's +1 Card
    expect(game.alice.hand).toEqual([...coppers(4), 'Silver']);
    expect(game.bob.hand).toEqual([...coppers(5), 'Gold', 'Silver']);
    expect(game.player('Cara').hand).toEqual([...coppers(5), 'Gold', 'Silver']);
  });

  it('played twice by Throne Room in a 3-player game, gives +4 Coffers and makes each other player discard down to 3 once', async () => {
    const game = createGame({ kingdom: ['Footpad', 'Throne Room'], players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['Throne Room', 'Footpad', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Estate', 'Estate', 'Copper', 'Copper', 'Silver']);
    game.player('Cara').setHand(['Curse', 'Copper', 'Copper', 'Gold', 'Gold']);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Footpad');
    game.expectDecision('chooseCards', 'Bob');
    await game.chooseCards(['Estate', 'Estate']);
    game.expectDecision('chooseCards', 'Cara');
    await game.chooseCards(['Curse', 'Copper']);

    // The second play finds both hands at 3 already
    game.expectDecision('treasurePhase', 'Alice');
    expect(game.bob.hand).toEqual(['Copper', 'Copper', 'Silver']);
    expect(game.player('Cara').hand).toEqual(['Copper', 'Gold', 'Gold']);
    expect(game.alice.coffers).toBe(4);
  });

  it('a Watchtower drawn by the +1 Card for a gain can still react to that gain', async () => {
    const game = createGame({ kingdom: ['Footpad', 'Workshop', 'Watchtower'] });
    game.alice.setHand(['Workshop', 'Copper']);
    game.alice.setDeck(['Watchtower', ...coppers(10)]);

    await game.start();
    await game.playAction('Workshop');
    await game.chooseCard('Silver');

    // Footpad drew the Watchtower, which is offered for the Silver
    expect(game.alice.hand).toEqual(['Copper', 'Watchtower']);
    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Trash it');

    expect(game.trash).toEqual(['Silver']);
    expect(game.alice.hand).toEqual(['Copper', 'Watchtower']);
  });

  it('a Weaver discarded to it gains two Silvers and draws for both, leaving more than 3 cards in hand', async () => {
    const game = createGame({ kingdom: ['Footpad', 'Weaver'] });
    game.alice.setHand(['Footpad', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Weaver', 'Estate', 'Estate', 'Copper', 'Copper']);
    game.bob.setDeck(['Gold', 'Gold', ...coppers(5)]);

    await game.start();
    await game.playAction('Footpad');
    game.expectDecision('chooseCards', 'Bob');
    await game.chooseCards(['Weaver', 'Estate']);
    await game.chooseEffect('Weaver');
    await game.chooseOption('Gain two Silvers');

    // Gained in Alice's Action phase: Bob draws a card for each Silver, and doesn't discard again
    expect(game.bob.hand).toEqual(['Estate', 'Copper', 'Copper', 'Gold', 'Gold']);
    expect(game.bob.discard).toEqual(expect.arrayContaining(['Estate', 'Silver', 'Silver']));
    game.expectDecision('treasurePhase', 'Alice');
  });
});
