import { CardLocation } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

describe('Advisor', () => {
  it('with 3 players, the player to the left chooses the card to discard', async () => {
    const game = createGame({ kingdom: ['Advisor'], players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['Advisor']);
    game.alice.setDeck(['Gold', 'Silver', 'Copper', 'Estate']);

    await game.start();
    await game.playAction('Advisor');
    game.expectDecision('chooseCard', 'Bob');
    await game.chooseCard('Gold');

    expect(game.alice.discard).toEqual(['Gold']);
    expect([...game.alice.hand].sort()).toEqual(['Copper', 'Silver']);
    expect(game.alice.deck).toEqual(['Estate']);
    expect(game.alice.actions).toBe(1);
  });

  it('shuffles to reveal 3 cards when the deck is short', async () => {
    const game = createGame({ kingdom: ['Advisor'] });
    game.alice.setHand(['Advisor']);
    game.alice.setDeck(['Copper']);
    game.alice.setDiscard(['Silver', 'Gold']);

    await game.start();
    await game.playAction('Advisor');
    game.expectDecision('chooseCard', 'Bob');
    expect(game.pending.cardChoices.map((choice) => choice.card.name).sort()).toEqual(['Copper', 'Gold', 'Silver']);
    await game.chooseCard('Gold');

    expect([...game.alice.hand].sort()).toEqual(['Copper', 'Silver']);
    expect(game.alice.discard).toEqual(['Gold']);
  });

  it('discards the only card it could reveal', async () => {
    const game = createGame({ kingdom: ['Advisor'] });
    game.alice.setHand(['Advisor']);
    game.alice.setDeck(['Gold']);

    await game.start();
    await game.playAction('Advisor');
    if (game.pending.kind === 'chooseCard' && game.pending.playerName === 'Bob') {
      await game.chooseCard('Gold');
    }

    expect(game.alice.hand).toEqual([]);
    expect(game.alice.discard).toEqual(['Gold']);
  });

  it('with 3 players, the player to the left of whoever plays it chooses, wrapping around to the first player', async () => {
    const game = createGame({ kingdom: ['Advisor'], players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(coppers(5));
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));
    game.player('Cara').setHand(['Advisor']);
    game.player('Cara').setDeck(['Gold', 'Silver', 'Estate', ...coppers(5)]);

    await game.start();
    await game.endTurn();
    await game.endTurn();
    expect(game.currentPlayerName).toBe('Cara');
    await game.playAction('Advisor');

    game.expectDecision('chooseCard', 'Alice');
    await game.chooseCard('Gold');
    expect(game.player('Cara').discard).toEqual(['Gold']);
    expect([...game.player('Cara').hand].sort()).toEqual(['Estate', 'Silver']);
  });

  it('a discarded Tunnel is discarded other than in Clean-up, so its owner can gain a Gold', async () => {
    const game = createGame({ kingdom: ['Advisor', 'Tunnel'] });
    game.alice.setHand(['Advisor']);
    game.alice.setDeck(['Tunnel', 'Silver', 'Copper', ...coppers(5)]);

    await game.start();
    await game.playAction('Advisor');
    game.expectDecision('chooseCard', 'Bob');
    await game.chooseCard('Tunnel');
    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    await game.chooseEffect('Tunnel');

    expect([...game.alice.discard].sort()).toEqual(['Gold', 'Tunnel']);
    expect([...game.alice.hand].sort()).toEqual(['Copper', 'Silver']);
  });

  it('the discarded card is only in the discard pile afterwards, so it is scored once', async () => {
    const game = createGame({ kingdom: ['Advisor'] });
    game.alice.setHand(['Advisor']);
    game.alice.setDeck(['Province', 'Silver', 'Copper', ...coppers(5)]);
    expect(game.alice.score).toBe(6);

    await game.start();
    await game.playAction('Advisor');
    await game.chooseCard('Province');

    expect(game.alice.discard).toEqual(['Province']);
    expect(game.alice.cards(CardLocation.REVEAL_LIMBO)).toEqual([]);
    expect(game.alice.score).toBe(6);
  });

  it('with an empty deck and discard pile, only gives +1 Action, and the player to the left has nothing to choose', async () => {
    const game = createGame({ kingdom: ['Advisor'] });
    game.alice.setHand(['Advisor', 'Copper']);

    await game.start();
    await game.playAction('Advisor');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.actions).toBe(1);
    expect(game.alice.hand).toEqual(['Copper']);
    expect(game.alice.discard).toEqual([]);
    expect(game.alice.cards(CardLocation.REVEAL_LIMBO)).toEqual([]);
  });

  it('with only 2 cards in the deck and an empty discard pile, reveals both; the player to the left picks the one to discard', async () => {
    const game = createGame({ kingdom: ['Advisor'] });
    game.alice.setHand(['Advisor']);
    game.alice.setDeck(['Gold', 'Silver']);

    await game.start();
    await game.playAction('Advisor');
    game.expectDecision('chooseCard', 'Bob');
    expect(game.pending.cardChoices.map((choice) => choice.card.name).sort()).toEqual(['Gold', 'Silver']);
    await game.chooseCard('Gold');

    expect(game.alice.hand).toEqual(['Silver']);
    expect(game.alice.discard).toEqual(['Gold']);
    expect(game.alice.deck).toEqual([]);
    expect(game.alice.actions).toBe(1);
  });

  it('with 1 card in the deck and 1 in the discard pile, shuffles and reveals just those 2', async () => {
    const game = createGame({ kingdom: ['Advisor'] });
    game.alice.setHand(['Advisor']);
    game.alice.setDeck(['Gold']);
    game.alice.setDiscard(['Silver']);

    await game.start();
    await game.playAction('Advisor');
    game.expectDecision('chooseCard', 'Bob');
    expect(game.pending.cardChoices.map((choice) => choice.card.name).sort()).toEqual(['Gold', 'Silver']);
    await game.chooseCard('Silver');

    expect(game.alice.hand).toEqual(['Gold']);
    expect(game.alice.discard).toEqual(['Silver']);
    expect(game.alice.deck).toEqual([]);
  });

  it('with an empty deck and 2 cards in the discard pile, shuffles and reveals both', async () => {
    const game = createGame({ kingdom: ['Advisor'] });
    game.alice.setHand(['Advisor']);
    game.alice.setDiscard(['Gold', 'Estate']);

    await game.start();
    await game.playAction('Advisor');
    game.expectDecision('chooseCard', 'Bob');
    await game.chooseCard('Gold');

    expect(game.alice.hand).toEqual(['Estate']);
    expect(game.alice.discard).toEqual(['Gold']);
  });

  it('reveals the 2 cards left in the deck, then shuffles the discard pile for the third, leaving the rest as the deck', async () => {
    const game = createGame({ kingdom: ['Advisor'] });
    game.alice.setHand(['Advisor']);
    game.alice.setDeck(['Gold', 'Silver']);
    game.alice.setDiscard(['Duchy', 'Duchy', 'Duchy']);

    await game.start();
    await game.playAction('Advisor');
    game.expectDecision('chooseCard', 'Bob');
    expect(game.pending.cardChoices.map((choice) => choice.card.name).sort()).toEqual(['Duchy', 'Gold', 'Silver']);
    await game.chooseCard('Gold');

    expect([...game.alice.hand].sort()).toEqual(['Duchy', 'Silver']);
    expect(game.alice.discard).toEqual(['Gold']);
    expect(game.alice.deck).toEqual(['Duchy', 'Duchy']);
  });

  it('when all 3 revealed cards have the same name, discards one of them without asking', async () => {
    const game = createGame({ kingdom: ['Advisor'] });
    game.alice.setHand(['Advisor']);
    game.alice.setDeck(['Silver', 'Silver', 'Silver', 'Estate']);

    await game.start();
    await game.playAction('Advisor');

    expect(game.alice.hand).toEqual(['Silver', 'Silver']);
    expect(game.alice.discard).toEqual(['Silver']);
    expect(game.alice.deck).toEqual(['Estate']);
  });

  it('played twice by Throne Room, reveals 3 new cards each time and gives +2 Actions', async () => {
    const game = createGame({ kingdom: ['Advisor', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Advisor']);
    game.alice.setDeck(['Gold', 'Silver', 'Copper', 'Province', 'Duchy', 'Estate', 'Curse']);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Advisor');
    game.expectDecision('chooseCard', 'Bob');
    await game.chooseCard('Gold');
    game.expectDecision('chooseCard', 'Bob');
    expect(game.pending.cardChoices.map((choice) => choice.card.name).sort()).toEqual(['Duchy', 'Estate', 'Province']);
    await game.chooseCard('Estate');

    expect([...game.alice.hand].sort()).toEqual(['Copper', 'Duchy', 'Province', 'Silver']);
    expect(game.alice.discard).toEqual(['Gold', 'Estate']);
    expect(game.alice.deck).toEqual(['Curse']);
    expect(game.alice.actions).toBe(2);
  });

  it('with 4 players, only the player to the left of the player playing it chooses', async () => {
    const game = createGame({ kingdom: ['Advisor'], players: ['Alice', 'Bob', 'Cara', 'Dave'] });
    game.alice.setHand(coppers(5));
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Advisor']);
    game.bob.setDeck(['Gold', 'Silver', 'Estate', ...coppers(5)]);

    await game.start();
    await game.endTurn();
    expect(game.currentPlayerName).toBe('Bob');
    await game.playAction('Advisor');

    game.expectDecision('chooseCard', 'Cara');
    await game.chooseCard('Silver');
    expect(game.bob.discard).toEqual(['Silver']);
    expect([...game.bob.hand].sort()).toEqual(['Estate', 'Gold']);
    game.expectDecision('treasurePhase', 'Bob');
  });
});
