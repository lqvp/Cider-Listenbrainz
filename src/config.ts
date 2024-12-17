import { setupConfig } from "./api/Config";

export const cfg = setupConfig({
    url: <string>'https://api.listenbrainz.org',
    apiKey: <string>'',
    useAppleMusicClientName: <boolean>true,
    enabled: <boolean>false,
});

export function useConfig() {
    return cfg.value;
}