import { Effect } from '../effects/Effect';

export class EffectChoice {
  constructor(
    private readonly name: string,
    private readonly effect: Effect,
  ) {}

  public getEffect(): Effect {
    return this.effect;
  }
}
