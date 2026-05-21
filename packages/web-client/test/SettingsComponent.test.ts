import { Injector, runInInjectionContext } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { GlobalSettingsService } from '../src/app/settings/global-settings.service';
import { SettingsComponent } from '../src/app/settings/settings.component';

describe('SettingsComponent', () => {
  it('toggles the settings panel while using the injected global settings service', () => {
    const settingsService = new GlobalSettingsService();
    const injector = Injector.create({
      providers: [{ provide: GlobalSettingsService, useValue: settingsService }],
    });

    const component = runInInjectionContext(injector, () => new SettingsComponent());

    expect(component.settingsService).toBe(settingsService);
    expect(component.isSettingsPanelOpen()).toBe(false);

    component.toggleSettings();
    expect(component.isSettingsPanelOpen()).toBe(true);

    component.toggleSettings();
    expect(component.isSettingsPanelOpen()).toBe(false);
  });
});
