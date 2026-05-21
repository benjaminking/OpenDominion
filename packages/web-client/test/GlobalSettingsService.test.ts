import { describe, expect, it } from 'vitest';

import { GlobalSettingsService } from '../src/app/settings/global-settings.service';

describe('GlobalSettingsService', () => {
  it('defaults to unofficial art assets', () => {
    const service = new GlobalSettingsService();

    expect(service.usingOfficialArt()).toBe(false);
    expect(service.assetDirectory()).toBe('card_assets');
  });

  it('switches asset directories when the art source changes', () => {
    const service = new GlobalSettingsService();

    service.useOfficialArt();

    expect(service.usingOfficialArt()).toBe(true);
    expect(service.assetDirectory()).toBe('official_card_assets');

    service.useUnofficialArt();

    expect(service.usingOfficialArt()).toBe(false);
    expect(service.assetDirectory()).toBe('card_assets');
  });
});
