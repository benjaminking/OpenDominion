import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';
import { coppers, limbo, offered } from './baseGameHelpers';

describe('Sentry', () => {
  it('looks at only the one card left in the deck after drawing', async () => {
    const game = createGame({ kingdom: ['Sentry'] });
    game.alice.setHand(['Sentry', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', 'Estate']);

    await game.start();
    await game.playAction('Sentry');
    const decision = game.expectDecision('chooseCards', 'Alice');
    expect(decision.cardChoices.map((choice) => choice.card.name)).toEqual(['Estate']);
    await game.chooseCards(['Estate']);

    // Nothing left to discard or put back
    game.expectDecision('treasurePhase', 'Alice');
    expect(game.trash).toEqual(['Estate']);
    expect(game.alice.hand).toContain('Silver');
    expect(game.alice.deck).toEqual([]);
  });

  it('shuffles the discard pile to look at 2 cards when the deck runs out', async () => {
    const game = createGame({ kingdom: ['Sentry'] });
    game.alice.setHand(['Sentry', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver']);
    game.alice.setDiscard(['Curse', 'Estate']);

    await game.start();
    await game.playAction('Sentry');
    const decision = game.expectDecision('chooseCards', 'Alice');
    expect(decision.cardChoices.map((choice) => choice.card.name).sort()).toEqual(['Curse', 'Estate']);
    await game.chooseCards(['Curse', 'Estate']);

    expect(game.trash.sort()).toEqual(['Curse', 'Estate']);
    expect(game.alice.deck).toEqual([]);
    expect(game.alice.discard).toEqual([]);
  });

  it('asks nothing when there are no cards left to look at', async () => {
    const game = createGame({ kingdom: ['Sentry'] });
    game.alice.setHand(['Sentry', 'Copper', 'Copper', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Sentry');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.hand).toHaveLength(4);
    expect(game.alice.actions).toBe(1);
  });

  it('trashes one card and discards the other', async () => {
    const game = createGame({ kingdom: ['Sentry'] });
    game.alice.setHand(['Sentry', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Curse', 'Estate', 'Gold']);

    await game.start();
    await game.playAction('Sentry');
    await game.chooseCards(['Curse']);
    const discardDecision = game.expectDecision('chooseCards', 'Alice');
    expect(discardDecision.cardChoices.map((choice) => choice.card.name)).toEqual(['Estate']);
    await game.chooseCards(['Estate']);

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.trash).toEqual(['Curse']);
    expect(game.alice.discard).toEqual(['Estate']);
    expect(game.alice.deck).toEqual(['Gold']);
  });

  it('only looks at the top 2 cards: other players are not shown the cards put back', async () => {
    const game = createGame({ kingdom: ['Sentry'] });
    game.alice.setHand(['Sentry', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Gold', 'Province', ...coppers(10)]);

    await game.start();
    await game.playAction('Sentry');
    await game.chooseCards([]);
    await game.chooseCards([]);
    await game.chooseCard('Gold');

    // "Look at the top 2 cards of your deck" (Base rulebook, 2nd edition): they are not revealed
    expect(game.alice.deck.slice(0, 2)).toEqual(['Province', 'Gold']);
    expect(game.bob.log.filter((line) => line.includes('Gold') || line.includes('Province'))).toEqual([]);
  });

  it('puts the kept cards back in the order chosen: each chosen card goes on top of the ones before it', async () => {
    const game = createGame({ kingdom: ['Sentry'] });
    game.alice.setHand(['Sentry', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Gold', 'Province', 'Estate', ...coppers(10)]);

    await game.start();
    await game.playAction('Sentry');
    await game.chooseCards([]);
    await game.chooseCards([]);
    const decision = game.expectDecision('chooseCard', 'Alice');
    expect(offered(decision).sort()).toEqual(['Gold', 'Province']);
    await game.chooseCard('Province');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.deck.slice(0, 3)).toEqual(['Gold', 'Province', 'Estate']);
    expect(limbo(game.alice)).toEqual([]);
  });

  it('asks nothing more after both cards are trashed', async () => {
    const game = createGame({ kingdom: ['Sentry'] });
    game.alice.setHand(['Sentry', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Curse', 'Estate', 'Gold']);

    await game.start();
    await game.playAction('Sentry');
    await game.chooseCards(['Curse', 'Estate']);

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.trash.sort()).toEqual(['Curse', 'Estate']);
    expect(game.alice.deck).toEqual(['Gold']);
    expect(limbo(game.alice)).toEqual([]);
  });

  it('asks nothing about putting back after both cards are discarded', async () => {
    const game = createGame({ kingdom: ['Sentry'] });
    game.alice.setHand(['Sentry', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Estate', 'Silver', 'Gold']);

    await game.start();
    await game.playAction('Sentry');
    await game.chooseCards([]);
    await game.chooseCards(['Estate', 'Silver']);

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.discard.sort()).toEqual(['Estate', 'Silver']);
    expect(game.alice.deck).toEqual(['Gold']);
    expect(limbo(game.alice)).toEqual([]);
  });

  it('shuffles in the middle of looking: the first card looked at is not shuffled into the new deck', async () => {
    const game = createGame({ kingdom: ['Sentry'] });
    game.alice.setHand(['Sentry', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', 'Estate']);
    game.alice.setDiscard(['Curse']);

    await game.start();
    await game.playAction('Sentry');
    const decision = game.expectDecision('chooseCards', 'Alice');
    expect(offered(decision).sort()).toEqual(['Curse', 'Estate']);
    await game.chooseCards(['Curse']);
    await game.chooseCards([]);

    expect(game.trash).toEqual(['Curse']);
    expect(game.alice.deck).toEqual(['Estate']);
    expect(game.alice.discard).toEqual([]);
  });

  it('triggers a "when discarded" reaction on a discarded card (Tunnel)', async () => {
    const game = createGame({ kingdom: ['Sentry', 'Tunnel'] });
    game.alice.setHand(['Sentry', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Tunnel', 'Estate', ...coppers(10)]);

    await game.start();
    await game.playAction('Sentry');
    await game.chooseCards([]);
    await game.chooseCards(['Tunnel']);
    await game.chooseEffect('Tunnel');

    expect(game.alice.discard.sort()).toEqual(['Gold', 'Tunnel']);
    expect(game.alice.deck[0]).toBe('Estate');
  });

  it('when played twice by Throne Room, draws a card the first play put back', async () => {
    const game = createGame({ kingdom: ['Sentry', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Sentry', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Gold', 'Silver', 'Curse', ...coppers(10)]);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Sentry');
    // First play: draws Copper; keeps Gold and Silver, with Gold on top
    await game.chooseCards([]);
    await game.chooseCards([]);
    await game.chooseCard('Silver');
    // Second play: draws Gold; looks at Silver and Curse
    const decision = game.expectDecision('chooseCards', 'Alice');
    expect(offered(decision).sort()).toEqual(['Curse', 'Silver']);
    await game.chooseCards(['Curse']);
    await game.chooseCards([]);

    expect(game.alice.hand.sort()).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Gold']);
    expect(game.alice.deck[0]).toBe('Silver');
    expect(game.trash).toEqual(['Curse']);
    expect(game.alice.actions).toBe(2);
  });

  it('trashing a Rats draws the card under the two looked at, not the one still being looked at', async () => {
    const game = createGame({ kingdom: ['Sentry', 'Rats'] });
    game.alice.setHand(['Sentry', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Rats', 'Gold', 'Silver', ...coppers(10)]);

    await game.start();
    await game.playAction('Sentry');
    await game.chooseCards(['Rats']);
    // Rats: when you trash this, +1 Card. The Gold is out of the deck while Sentry resolves, so the Silver is drawn
    expect(game.alice.hand).toContain('Silver');
    expect(game.alice.hand).not.toContain('Gold');
    await game.chooseCards([]);

    expect(game.trash).toEqual(['Rats']);
    expect(game.alice.deck[0]).toBe('Gold');
    expect(limbo(game.alice)).toEqual([]);
  });

  it('a discarded Trail played from the discard pile draws the card beneath the one still being looked at', async () => {
    const game = createGame({ kingdom: ['Sentry', 'Trail'] });
    game.alice.setHand(['Sentry', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Trail', 'Gold', 'Silver', ...coppers(10)]);

    await game.start();
    await game.playAction('Sentry');
    await game.chooseCards([]);
    await game.chooseCards(['Trail']);
    // Trail: when you discard this other than in Clean-up, you may play it (+1 Card +1 Action)
    await game.chooseEffect('Trail');

    expect(game.alice.inPlay).toEqual(['Sentry', 'Trail']);
    expect(game.alice.hand).toContain('Silver');
    expect(game.alice.hand).not.toContain('Gold');

    // Sentry then puts the Gold, the only card left, back without asking
    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.deck[0]).toBe('Gold');
    expect(game.alice.actions).toBe(2);
    expect(limbo(game.alice)).toEqual([]);
  });
});
