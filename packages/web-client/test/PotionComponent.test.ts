import '@angular/compiler';
import { Injector, runInInjectionContext } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { PotionComponent } from '../src/app/icons/potion.component';
import { setInputSignalValue } from './angular-test-utils';

describe('PotionComponent', () => {
  it('defaults to the medium size and accepts a size input', () => {
    const injector = Injector.create({ providers: [] });
    const component = runInInjectionContext(injector, () => new PotionComponent());

    expect(component.size()).toBe('medium');

    setInputSignalValue(component.size as () => string, 'full');
    expect(component.size()).toBe('full');
  });
});
