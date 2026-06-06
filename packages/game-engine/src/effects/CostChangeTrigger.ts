import { CardEligibilityFunction } from '../CardEligibilityFunction';
import { anyCard } from '../StandardCardEligibilityFunctions';
import { EffectTriggerType } from './EffectTriggerType';

export class CostChangeTrigger {
  private triggerType: EffectTriggerType = EffectTriggerType.NEVER;
  private cardEligibility: CardEligibilityFunction = anyCard;

  public getTriggerType(): EffectTriggerType {
    return this.triggerType;
  }

  public getCardEligibility(): CardEligibilityFunction {
    return this.cardEligibility;
  }

  public static Builder = class {
    costChangeTrigger: CostChangeTrigger = new CostChangeTrigger();

    public triggerOn(triggerType: EffectTriggerType) {
      this.costChangeTrigger.triggerType = triggerType;
      return this;
    }

    public whereCardIs(cardEligibility: CardEligibilityFunction): this {
      this.costChangeTrigger.cardEligibility = cardEligibility;
      return this;
    }

    public build(): CostChangeTrigger {
      return this.costChangeTrigger;
    }
  };
}
