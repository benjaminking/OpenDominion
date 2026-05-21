import {
  Injector,
  type Provider,
  ɵChangeDetectionScheduler as ChangeDetectionScheduler,
  ɵEffectScheduler as EffectScheduler,
} from '@angular/core';

interface SchedulableEffectLike {
  run(): void;
  zone: { run<T>(fn: () => T): T } | null;
  dirty: boolean;
}

class TestEffectScheduler {
  private readonly queuedEffects = new Set<SchedulableEffectLike>();

  add(effect: SchedulableEffectLike): void {
    this.queuedEffects.add(effect);
  }

  schedule(effect: SchedulableEffectLike): void {
    this.queuedEffects.add(effect);
  }

  flush(): void {
    while (this.queuedEffects.size > 0) {
      const effectsToRun = [...this.queuedEffects];
      this.queuedEffects.clear();
      for (const effect of effectsToRun) {
        if (!effect.dirty) {
          continue;
        }
        if (effect.zone !== null) {
          effect.zone.run(() => effect.run());
        } else {
          effect.run();
        }
      }
    }
  }

  remove(effect: SchedulableEffectLike): void {
    this.queuedEffects.delete(effect);
  }
}

export function createAngularTestInjector(providers: Provider[]) {
  const effectScheduler = new TestEffectScheduler();
  const injector = Injector.create({
    providers: [
      {
        provide: ChangeDetectionScheduler,
        useValue: {
          notify: () => {},
          runningTick: false,
        },
      },
      {
        provide: EffectScheduler,
        useValue: effectScheduler,
      },
      ...providers,
    ],
  });

  return { injector, effectScheduler };
}

export function setInputSignalValue<T>(inputSignal: () => T, value: T): void {
  const signalLike = inputSignal as (() => T) & Record<PropertyKey, unknown>;

  const signalNodeSymbol = Object.getOwnPropertySymbols(signalLike).find((symbol) => {
    const candidate = signalLike[symbol] as { applyValueToInputSignal?: unknown } | undefined;
    return typeof candidate?.applyValueToInputSignal === 'function';
  });

  if (signalNodeSymbol === undefined) {
    throw new Error('Could not locate Angular input signal node');
  }

  const signalNode = signalLike[signalNodeSymbol] as {
    applyValueToInputSignal: (node: unknown, nextValue: T) => void;
  };
  signalNode.applyValueToInputSignal(signalNode, value);
}
