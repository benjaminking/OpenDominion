import { CardLocation, GameOutcome } from '@dominion/common';

import { GameHarness, PendingDecision, TestPlayer } from '../gameHarness';

// The harness can read the Island and Native Village mats but has no setup helpers for them
export const putOnIslandMat = (player: TestPlayer, names: string[]): void => {
  for (const name of names) {
    player.player.getOwnedCards().addCardToIslandMat(player.createCard(name, CardLocation.ISLAND_MAT));
  }
};

export const putOnNativeVillageMat = (player: TestPlayer, names: string[]): void => {
  for (const name of names) {
    player.player.getOwnedCards().addCardToNativeVillageMat(player.createCard(name, CardLocation.NATIVE_VILLAGE_MAT));
  }
};

/** Names of the cards offered by a decision. */
export const offered = (decision: PendingDecision): string[] => decision.cardChoices.map((choice) => choice.card.name);

/** Names of the effects (optional and mandatory) offered by a "choose which effect" decision. */
export const offeredEffects = (decision: PendingDecision): string[] =>
  [...decision.optionalEffects, ...decision.mandatoryEffects].map((effect) => effect.effectName);

export const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

const isChoosingEffects = (game: GameHarness): boolean => game.queue.pending?.kind === 'chooseFromMultipleEvents';

/**
 * Resolves the start-of-turn (or other) effects named in `order`, in that order, then any remaining mandatory
 * effects in the order offered (e.g. Outpost's own bookkeeping effect). Once only one card's effects are left,
 * the engine resolves them without asking, so the last names in `order` may not need choosing.
 */
export const resolveEffects = async (game: GameHarness, order: string[] = []): Promise<void> => {
  for (const name of order) {
    if (!isChoosingEffects(game)) {
      break;
    }
    await game.chooseEffect(name);
  }
  while (isChoosingEffects(game) && game.pending.mandatoryEffects.length > 0) {
    await game.chooseEffect(game.pending.mandatoryEffects[0].effectName);
  }
};

export const outcomeOf = (game: GameHarness, playerName: string): GameOutcome | undefined =>
  game.gameResult?.playerResults.find((result) => result.playerName === playerName)?.outcome;

export const turnsOf = (game: GameHarness, playerName: string): number | undefined =>
  game.gameResult?.playerResults.find((result) => result.playerName === playerName)?.turns;
