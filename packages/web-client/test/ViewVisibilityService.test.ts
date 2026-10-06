import '@angular/compiler';
import { describe, expect, it } from 'vitest';

import { ViewVisibilityService } from '../src/app/view-visibility.service';
import { ViewName } from '../src/app/view-names';

describe('ViewVisibilityService', () => {
  it('toggles, enables, and disables known view names', () => {
    const service = new ViewVisibilityService();
    const revealedSignal = service.getViewVisibilitySignal(ViewName.REVEALED_LIMBO);

    expect(revealedSignal()).toBe(false);

    service.toggleViewByName(ViewName.REVEALED_LIMBO);
    expect(revealedSignal()).toBe(true);

    service.disableViewByName(ViewName.REVEALED_LIMBO);
    expect(revealedSignal()).toBe(false);

    service.enableViewByName(ViewName.REVEALED_LIMBO);
    expect(revealedSignal()).toBe(true);
  });

  it('ignores unknown view names and returns a false signal for unknown lookup', () => {
    const service = new ViewVisibilityService();
    const unknownView = 'not-a-real-view' as unknown as ViewName;

    const unknownSignal = service.getViewVisibilitySignal(unknownView);

    expect(unknownSignal()).toBe(false);

    service.toggleViewByName(unknownView);
    service.enableViewByName(unknownView);
    service.disableViewByName(unknownView);

    expect(unknownSignal()).toBe(false);
  });
});
