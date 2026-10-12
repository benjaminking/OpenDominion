import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const KINGDOM = ['Scheme', 'Throne Room', 'Village', 'Smithy'];
const COPPERS = Array<string>(10).fill('Copper');

describe('Scheme', () => {
  it('puts an Action card from play onto the deck at Clean-up, to be drawn next turn, only this turn', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Scheme', 'Village', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck([...COPPERS, ...COPPERS]);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Scheme');
    await game.endTurn();

    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    await game.chooseEffect('Scheme');
    const choice = game.expectDecision('chooseCard', 'Alice');
    expect(choice.noneAllowed).toBe(true);
    expect(choice.cardChoices.map((option) => option.card.name)).toEqual(['Village', 'Scheme']);
    await game.chooseCard('Village');

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.hand).toEqual(['Village', 'Copper', 'Copper', 'Copper', 'Copper']);
    expect(game.alice.discard).toContain('Scheme');
    expect(game.alice.discard).not.toContain('Village');

    // On Alice's next turn, without a Scheme played, there is nothing to choose at Clean-up
    await game.endTurn();
    await game.playAction('Village');
    await game.endTurn();
    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.discard.slice(-6)).toEqual(['Village', 'Copper', 'Copper', 'Copper', 'Copper', 'Copper']);
  });

  it('is cumulative: with two Schemes, two Action cards can go onto the deck, including a Scheme', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Scheme', 'Scheme', 'Smithy', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Scheme');
    await game.playAction('Scheme');
    await game.playAction('Smithy');
    await game.endTurn();

    await game.chooseEffect('Scheme');
    await game.chooseCard('Smithy');
    await game.chooseEffect('Scheme');
    await game.chooseCard('Scheme');

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.hand.slice(0, 2)).toEqual(['Scheme', 'Smithy']);
    expect(game.alice.discard.filter((name) => name === 'Scheme')).toHaveLength(1);
  });

  it('is cumulative when played twice by Throne Room', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Throne Room', 'Scheme', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Scheme');
    await game.endTurn();

    await game.chooseEffect('Scheme');
    await game.chooseCard('Scheme');
    await game.chooseEffect('Scheme');
    await game.chooseCard('Throne Room');

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.hand.slice(0, 2)).toEqual(['Throne Room', 'Scheme']);
  });

  it("doesn't offer a Duration card that stays in play", async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Wharf'] });
    game.alice.setHand(['Village', 'Scheme', 'Wharf', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Scheme');
    await game.playAction('Wharf');
    await game.endTurn();

    await game.chooseEffect('Scheme');
    const choice = game.expectDecision('chooseCard', 'Alice');
    expect(choice.cardChoices.map((option) => option.card.name)).toEqual(['Village', 'Scheme']);
    await game.chooseCard('Village');

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.inPlay).toEqual(['Wharf']);
    expect(game.alice.hand[0]).toBe('Village');
  });

  it('still works after Procession has played it twice and trashed it', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Procession'] });
    game.alice.setHand(['Procession', 'Scheme', 'Village', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Procession');
    await game.chooseCard('Scheme');
    // Scheme ($3) is trashed; gain an Action costing exactly $4
    await game.chooseCard('Smithy');
    expect(game.trash).toEqual(['Scheme']);
    expect(game.alice.actions).toBe(2);
    await game.playAction('Village');
    await game.endTurn();

    await game.chooseEffect('Scheme');
    await game.chooseCard('Procession');
    await game.chooseEffect('Scheme');
    await game.chooseCard('Village');

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.hand.slice(0, 2)).toEqual(['Village', 'Procession']);
  });

  it('offers Action cards with other types (Mill, Coronet played as a Treasure), but not a Cauldron', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Mill', 'Cauldron'] });
    game.alice.setHand(['Scheme', 'Mill', 'Coronet', 'Cauldron', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Scheme');
    await game.playAction('Mill');
    await game.chooseCards([]);
    await game.endActionPhase();
    await game.playTreasure('Coronet');
    await game.chooseNone();
    await game.playTreasure('Cauldron');
    await game.endTurn();

    await game.chooseEffect('Scheme');
    const choice = game.expectDecision('chooseCard', 'Alice');
    expect(choice.cardChoices.map((option) => option.card.name).sort()).toEqual(['Coronet', 'Mill', 'Scheme']);
    await game.chooseCard('Coronet');

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.hand[0]).toBe('Coronet');
    expect(game.alice.discard).toEqual(expect.arrayContaining(['Scheme', 'Mill', 'Cauldron']));
  });

  it("puts the card onto the deck for Outpost's 3-card hand, and does nothing on the extra turn", async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Outpost'] });
    game.alice.setHand(['Village', 'Scheme', 'Outpost', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Copper', ...COPPERS]);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Scheme');
    await game.playAction('Outpost');
    await game.endTurn();
    await game.chooseEffect('Scheme');
    await game.chooseCard('Village');
    await game.chooseExtraTurn('Outpost');

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toEqual(['Village', 'Copper', 'Copper']);
    await game.playAction('Village');
    await game.endTurn();

    // No Scheme prompt in the extra turn's Clean-up
    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.discard).toContain('Village');
  });
});
