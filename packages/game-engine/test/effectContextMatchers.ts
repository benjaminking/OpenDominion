import { CardLocation } from '@dominion/common';

import { Card } from '../src/card/Card';
import { EffectContext } from '../src/effects/EffectContext';

// Matches an EffectContext by the cards and gain location it was triggered with, and optionally by whether its
// location expectation is met for those cards. (Expectations hold the time they were created, so two contexts for
// the same event aren't equal.)
export const effectContextFor = (
  targetCards: Card[],
  options: { gainLocation?: CardLocation; expectationMet?: boolean } = {},
) => ({
  asymmetricMatch: (actual: unknown): boolean => {
    if (!(actual instanceof EffectContext)) {
      return false;
    }
    const actualTargets = actual.getTargetCards()?.asCardArray() ?? [];
    return (
      actualTargets.length === targetCards.length &&
      actualTargets.every((card: Card, index: number) => card === targetCards[index]) &&
      actual.getGainLocation() === options.gainLocation &&
      (options.expectationMet === undefined ||
        targetCards.every((card: Card) => actual.getLocationExpectation()!.isMet(card) === options.expectationMet))
    );
  },
  toAsymmetricMatcher: (): string =>
    `EffectContext for [${targetCards.map((card: Card) => card.getId()).join(', ')}]` +
    (options.gainLocation === undefined ? '' : ` gained to ${options.gainLocation}`),
});
