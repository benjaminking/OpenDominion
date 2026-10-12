import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const KINGDOM = ['Trader', "Witch's Hut", 'Border Village', 'Highway', 'Village', 'Smithy'];
const COPPERS = Array<string>(10).fill('Copper');

describe('Trader', () => {
  it('exchanges a bought card for a Silver, returning the bought card to its pile', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Trader', 'Gold', 'Gold', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    const golds = game.pileSize('Gold');
    const silvers = game.pileSize('Silver');

    await game.start();
    await game.endActionPhase();
    await game.playAllTreasures();
    await game.buy('Gold');

    const reaction = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(reaction.optionalEffects.map((effect) => effect.effectName)).toEqual(['Trader']);
    await game.chooseEffect('Trader');

    expect(game.pileSize('Gold')).toBe(golds);
    expect(game.pileSize('Silver')).toBe(silvers - 1);
    // The Silver, then Clean-up's cards: no bought Gold
    expect(game.alice.discard).toEqual(['Silver', 'Gold', 'Gold', 'Copper', 'Copper', 'Trader']);
  });

  it('lets another player exchange a Curse gained from an Attack for a Silver', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(["Witch's Hut", 'Village', 'Smithy', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Trader', 'Estate', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(COPPERS);
    const curses = game.pileSize('Curse');

    await game.start();
    await game.playAction("Witch's Hut");
    await game.chooseCards(['Village', 'Smithy']);

    const reaction = game.expectDecision('chooseFromMultipleEvents', 'Bob');
    expect(reaction.optionalEffects.map((effect) => effect.effectName)).toEqual(['Trader']);
    await game.chooseEffect('Trader');

    expect(game.pileSize('Curse')).toBe(curses);
    expect(game.bob.discard).toEqual(['Silver']);
    expect(game.bob.hand).toContain('Trader');
  });

  it("still gains Border Village's cheaper card after exchanging it, and can exchange that card too", async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Trader', 'Gold', 'Gold', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    const borderVillages = game.pileSize('Border Village');
    const duchies = game.pileSize('Duchy');
    const silvers = game.pileSize('Silver');

    await game.start();
    await game.endActionPhase();
    await game.playAllTreasures();
    await game.buy('Border Village');

    const reaction = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(reaction.optionalEffects.map((effect) => effect.effectName)).toEqual(['Trader']);
    expect(reaction.mandatoryEffects.map((effect) => effect.effectName)).toEqual(['Border Village']);
    await game.chooseEffect('Trader');
    expect(game.pileSize('Border Village')).toBe(borderVillages);
    expect(game.alice.discard).toEqual(['Silver']);

    // Border Village's ability still happens
    await game.chooseCard('Duchy');
    await game.chooseEffect('Trader');

    expect(game.pileSize('Duchy')).toBe(duchies);
    expect(game.pileSize('Silver')).toBe(silvers - 2);
    expect(game.alice.discard.slice(0, 2)).toEqual(['Silver', 'Silver']);
  });

  it('gains a Silver per $1 of the current cost, so fewer with Highway in play', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Highway', 'Trader', 'Estate', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Highway');
    await game.playAction('Trader');
    await game.chooseCard('Estate');

    expect(game.trash).toEqual(['Estate']);
    expect(game.alice.discard).toEqual(['Silver']);
  });

  it('is still offered for a Trail that was played when gained, but has lost track of it', async () => {
    const game = createGame({ kingdom: ['Trader', 'Trail', 'Workshop', 'Village'] });
    game.alice.setHand(['Workshop', 'Trader', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', ...COPPERS]);
    const trails = game.pileSize('Trail');
    const silvers = game.pileSize('Silver');

    await game.start();
    await game.playAction('Workshop');
    await game.chooseCard('Trail');

    const reactions = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(reactions.optionalEffects.map((effect) => effect.effectName).sort()).toEqual(['Trader', 'Trail']);
    await game.chooseEffect('Trail');

    // Trail is in play now: Trader is still offered, but has lost track of it
    const trader = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(trader.optionalEffects.map((effect) => effect.effectName)).toEqual(['Trader']);
    await game.chooseEffect('Trader');

    expect(game.alice.log).toContain('Alice reveals Trader');
    expect(game.alice.log).toContain('Alice has lost track of Trail');
    game.expectDecision('actionPhase', 'Alice');
    expect(game.alice.inPlay).toEqual(['Workshop', 'Trail']);
    expect(game.alice.discard).toEqual([]);
    expect(game.pileSize('Trail')).toBe(trails - 1);
    expect(game.pileSize('Silver')).toBe(silvers);
  });

  it('is still offered for a card that Watchtower has already trashed, but has lost track of it', async () => {
    const game = createGame({ kingdom: ['Trader', 'Watchtower', 'Village'] });
    game.alice.setHand(['Watchtower', 'Trader', 'Silver', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    const silvers = game.pileSize('Silver');

    await game.start();
    await game.endActionPhase();
    await game.playAllTreasures();
    await game.buy('Silver');

    const reactions = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(reactions.optionalEffects.map((effect) => effect.effectName).sort()).toEqual(['Trader', 'Watchtower']);
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Trash it');

    // Trader is still offered, but has lost track of the Silver
    const trader = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(trader.optionalEffects.map((effect) => effect.effectName)).toEqual(['Trader']);
    await game.chooseEffect('Trader');

    expect(game.alice.log).toContain('Alice has lost track of Silver');
    expect(game.currentPlayerName).toBe('Bob');
    expect(game.trash).toEqual(['Silver']);
    expect(game.pileSize('Silver')).toBe(silvers - 1);
    // Only the Silver that was played is in the discard pile
    expect(game.alice.discard.filter((name) => name === 'Silver')).toHaveLength(1);
  });

  it('is still offered for a card that Watchtower has already put onto the deck, but has lost track of it', async () => {
    const game = createGame({ kingdom: ['Trader', 'Watchtower', 'Village'] });
    game.alice.setHand(['Watchtower', 'Trader', 'Silver', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    const silvers = game.pileSize('Silver');

    await game.start();
    await game.endActionPhase();
    await game.playAllTreasures();
    await game.buy('Silver');
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Put it onto your deck');

    // Trader is still offered, but has lost track of the Silver; the Silver on the deck is drawn in Clean-up
    const trader = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(trader.optionalEffects.map((effect) => effect.effectName)).toEqual(['Trader']);
    await game.chooseEffect('Trader');

    expect(game.alice.log).toContain('Alice has lost track of Silver');
    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.hand).toEqual(['Silver', 'Copper', 'Copper', 'Copper', 'Copper']);
    expect(game.pileSize('Silver')).toBe(silvers - 1);
  });

  it("leaves Watchtower nothing to move once it has exchanged a Province, but another player's Fool's Gold still reacts", async () => {
    const game = createGame({ kingdom: ['Trader', 'Watchtower', "Fool's Gold", 'Village'] });
    game.alice.setHand(['Trader', 'Watchtower', 'Gold', 'Gold', 'Silver']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(["Fool's Gold", 'Estate', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(COPPERS);
    const provinces = game.pileSize('Province');

    await game.start();
    await game.endActionPhase();
    await game.playAllTreasures();
    await game.buy('Province');

    // Alice, whose turn it is, resolves her reactions first
    const reactions = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(reactions.optionalEffects.map((effect) => effect.effectName).sort()).toEqual(['Trader', 'Watchtower']);
    await game.chooseEffect('Trader');

    // The Province is back in its pile: Watchtower is still offered, but has lost track of it
    const watchtower = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(watchtower.optionalEffects.map((effect) => effect.effectName)).toEqual(['Watchtower']);
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Trash it');
    expect(game.alice.log).toContain('Alice has lost track of Province');

    // It was still gained, so Fool's Gold reacts
    const foolsGold = game.expectDecision('chooseFromMultipleEvents', 'Bob');
    expect(foolsGold.optionalEffects.map((effect) => effect.effectName)).toEqual(["Fool's Gold"]);
    await game.chooseEffect("Fool's Gold");

    expect(game.pileSize('Province')).toBe(provinces);
    expect(game.trash).toEqual(["Fool's Gold"]);
    expect(game.bob.deck[0]).toBe('Gold');
    expect(game.alice.discard[0]).toBe('Silver');
    expect(game.alice.discard).not.toContain('Province');
  });

  it('is still offered for an Inn that its own on-gain ability shuffled into the deck, but has lost track of it', async () => {
    const game = createGame({ kingdom: ['Trader', 'Inn', 'Village'] });
    game.alice.setHand(['Trader', 'Gold', 'Silver', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    const inns = game.pileSize('Inn');
    const silvers = game.pileSize('Silver');

    await game.start();
    await game.endActionPhase();
    await game.playAllTreasures();
    await game.buy('Inn');

    const reactions = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(reactions.optionalEffects.map((effect) => effect.effectName)).toEqual(['Trader']);
    expect(reactions.mandatoryEffects.map((effect) => effect.effectName)).toEqual(['Inn']);
    await game.chooseEffect('Inn');
    await game.chooseCards(['Inn']);

    // The Inn has moved into the deck: Trader is still offered, but has lost track of it
    const trader = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(trader.optionalEffects.map((effect) => effect.effectName)).toEqual(['Trader']);
    await game.chooseEffect('Trader');

    expect(game.alice.log).toContain('Alice has lost track of Inn');
    expect(game.currentPlayerName).toBe('Bob');
    expect(game.pileSize('Inn')).toBe(inns - 1);
    expect(game.pileSize('Silver')).toBe(silvers);
    expect([...game.alice.hand, ...game.alice.deck]).toContain('Inn');
  });

  it("still resolves Inn's on-gain ability after exchanging the Inn, but the Inn can't be shuffled in", async () => {
    const game = createGame({ kingdom: ['Trader', 'Inn', 'Village'] });
    game.alice.setHand(['Trader', 'Gold', 'Silver', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.alice.setDiscard(['Village', 'Estate']);
    const inns = game.pileSize('Inn');

    await game.start();
    await game.endActionPhase();
    await game.playAllTreasures();
    await game.buy('Inn');
    await game.chooseEffect('Trader');

    const reveal = game.expectDecision('chooseCards', 'Alice');
    expect(reveal.cardChoices.map((choice) => choice.card.name)).toEqual(['Village']);
    await game.chooseCards(['Village']);

    expect(game.pileSize('Inn')).toBe(inns);
    expect(game.currentPlayerName).toBe('Bob');
    expect([...game.alice.hand, ...game.alice.deck]).toContain('Village');
    expect(game.alice.discard.slice(0, 2)).toEqual(['Estate', 'Silver']);
  });

  it('exchanges a card gained onto the deck, putting the Silver into the discard pile', async () => {
    const game = createGame({ kingdom: ['Trader', 'Develop', 'Smithy', 'Village'] });
    game.alice.setHand(['Develop', 'Trader', 'Silver', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    const smithies = game.pileSize('Smithy');

    await game.start();
    await game.playAction('Develop');
    await game.chooseCard('Silver');
    // $4 first, onto the deck; Trader exchanges it
    await game.chooseCard('Smithy');
    await game.chooseEffect('Trader');
    expect(game.pileSize('Smithy')).toBe(smithies);
    expect(game.alice.discard).toEqual(['Silver']);
    expect(game.alice.deck).toEqual(COPPERS);

    // Then the $2 card, onto the deck
    await game.chooseCard('Estate');
    await game.declineEffects();
    expect(game.alice.deck).toEqual(['Estate', ...COPPERS]);
  });

  it('can exchange a card gained into hand, even the Trader itself', async () => {
    const game = createGame({ kingdom: ['Trader', 'Artisan', 'Village'] });
    game.alice.setHand(['Artisan', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    const traders = game.pileSize('Trader');

    await game.start();
    await game.playAction('Artisan');
    await game.chooseCard('Trader');
    await game.chooseEffect('Trader');

    // The Trader goes back to its pile and the Silver to the discard pile; then Artisan topdecks a card from hand
    expect(game.pileSize('Trader')).toBe(traders);
    expect(game.alice.discard).toEqual(['Silver']);
    const topdeck = game.expectDecision('chooseCard', 'Alice');
    expect(topdeck.cardChoices.map((choice) => choice.card.name)).toEqual(['Copper', 'Copper', 'Copper', 'Copper']);
    await game.chooseCard('Copper');
  });

  it('gains a Silver per $1 of the cost only: trashing a Golem ($4P) gains 4', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Golem'] });
    game.alice.setHand(['Trader', 'Golem', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Trader');
    await game.chooseCard('Golem');

    expect(game.trash).toEqual(['Golem']);
    expect(game.alice.discard).toEqual(['Silver', 'Silver', 'Silver', 'Silver']);
  });

  it('uses the cost with Bridge and Highway stacked: trashing a Gold gains 4 Silvers', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Bridge'] });
    game.alice.setHand(['Village', 'Bridge', 'Highway', 'Trader', 'Gold']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Bridge');
    await game.playAction('Highway');
    await game.playAction('Trader');
    await game.chooseCard('Gold');

    expect(game.alice.discard).toEqual(['Silver', 'Silver', 'Silver', 'Silver']);
  });

  it('gains only the Silvers that are left', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Trader', 'Gold', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.setPileSize('Silver', 2);

    await game.start();
    await game.playAction('Trader');
    await game.chooseCard('Gold');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.discard).toEqual(['Silver', 'Silver']);
    expect(game.pileSize('Silver')).toBe(0);
  });

  it('exchanges a gained card only once, even with two Traders in hand', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Trader', 'Trader', 'Gold', 'Gold', 'Copper']);
    game.alice.setDeck(COPPERS);
    const golds = game.pileSize('Gold');
    const silvers = game.pileSize('Silver');

    await game.start();
    await game.endActionPhase();
    await game.playAllTreasures();
    await game.buy('Gold');

    const reactions = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(reactions.optionalEffects.map((effect) => effect.effectName)).toEqual(['Trader', 'Trader']);
    await game.chooseEffect('Trader');

    // The Gold is back in its pile: the second Trader is still offered, but has lost track of it
    const secondTrader = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(secondTrader.optionalEffects.map((effect) => effect.effectName)).toEqual(['Trader']);
    await game.chooseEffect('Trader');

    expect(game.alice.log).toContain('Alice has lost track of Gold');
    expect(game.currentPlayerName).toBe('Bob');
    expect(game.pileSize('Gold')).toBe(golds);
    expect(game.pileSize('Silver')).toBe(silvers - 1);
  });

  it('returns an exchanged Spoils to its non-Supply pile, and an exchanged Ruins to the top of the Ruins pile', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Marauder'] });
    game.alice.setHand(['Marauder', 'Trader', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Trader', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(COPPERS);
    game.setPile('Ruins', ['Ruined Market', 'Survivors']);
    const spoils = game.pileSize('Spoils');

    await game.start();
    await game.playAction('Marauder');
    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    await game.chooseEffect('Trader');
    expect(game.pileSize('Spoils')).toBe(spoils);

    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.chooseEffect('Trader');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.pileCards('Ruins')).toEqual(['Ruined Market', 'Survivors']);
    expect(game.alice.discard).toEqual(['Silver']);
    expect(game.bob.discard).toEqual(['Silver']);
  });
});
