import { defineCustomElement } from "./api/CustomElement/apiCustomElement.ts";
import { PluginAPI } from "./api/PluginAPI";
import settings from "./components/settings.vue";
import { customElementName } from "./utils";
import config from './plugin.config.ts'
import { createApp, h } from 'vue'
import { createPinia } from "pinia";
import { useMusicKit } from "./api/MusicKit.ts";
import { useConfig } from "./config.ts";

/**
 * Initializing a Vue app instance so we can use things like Pinia.
 */
const pinia = createPinia()
const pluginApp = createApp(h('div'));
pluginApp.use(pinia)

/**
 * Custom Elements that will be registered in the app
 */
export const CustomElements
    = {
    'settings': defineCustomElement(settings, {
        shadowRoot: false,
        appContext: pluginApp,
    }),
}

export default {
    name: 'ListenBrainz',
    identifier: config.identifier,
    /**
     * Defining our custom settings panel element
     */
    SettingsElement: customElementName('settings'),
    /**
     * Initial setup function that is executed when the plugin is loaded
     */
    setup() {
        // Temp workaround
        // @ts-ignore
        window.__VUE_OPTIONS_API__ = true
        for (const [key, value] of Object.entries(CustomElements)) {
            const _key = key as keyof typeof CustomElements;
            customElements.define(customElementName(_key), value)
        }

        const musickit = useMusicKit();

        let oldData: any = {};

        musickit.addEventListener('playbackStateDidChange', async () => {
            const cfg = useConfig();
            if (!cfg.enabled) return;
            let currentOldData = oldData;
            const currentItem = musickit.nowPlayingItem;

            if (Object.keys(currentOldData).length === 0) return;

            if (!currentItem && musickit.queue._nextPlayableItemIndex === -1) {
                const scrobble_data = {
                    listen_type: "single",
                    payload: [
                    {
                        listened_at: currentOldData.listenedAt,
                        track_metadata: {
                            additional_info: {
                                media_player: "Apple Music",
                                submission_client: "Apple Music",
                                music_service: "music.apple.com",
                                duration_ms: currentOldData.attributes.durationInMillis,
                                origin_url: currentOldData.attributes.url,
                            },
                            artist_name: currentOldData.attributes.artistName,
                            track_name: currentOldData.attributes.name,
                        },
                    },
                    ],
                };

                // Clear old data before POSTing as the await causes issues due to this event firing like 3 times in a row
                oldData = {};
                currentOldData = {};

                const request = new Request(`${cfg.url}/1/submit-listens`, {
                    method: "POST",
                    body: JSON.stringify(scrobble_data),
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Token ${cfg.apiKey}`,
                    },
                });

                await fetch(request);
            }
        })

        musickit.addEventListener('mediaItemStateDidChange', async () => {
            const cfg = useConfig();
            if (!cfg.enabled) return;
            const currentOldData = oldData;
            const currentItem = musickit.nowPlayingItem;


            // Check if PlayingItem exists first as this triggers even while it still isn't set
            if (!currentItem) return;
            // Check if oldData is populated and if it is the same id as the event fires a few times before the currentItem switches over.
            if (Object.keys(currentOldData).length > 0 && currentItem.id === currentOldData.id) return;

            oldData = musickit.nowPlayingItem;
            oldData.listenedAt = Math.floor(new Date().getTime() / 1000);

            const playing_data = {
                listen_type: "playing_now",
                payload: [
                  {
                    track_metadata: {
                      additional_info: {
                        media_player: "Apple Music",
                        submission_client: "Apple Music",
                        music_service: "music.apple.com",
                        duration_ms: currentItem.attributes.durationInMillis,
                        origin_url: currentItem.attributes.url,
                      },
                      artist_name: currentItem.attributes.artistName,
                      track_name: currentItem.attributes.name,
                    },
                  },
                ],
            };

            const request = new Request(`${cfg.url}/1/submit-listens`, {
                method: "POST",
                body: JSON.stringify(playing_data),
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Token ${cfg.apiKey}`,
                },
            });
            await fetch(request);

            if (Object.keys(currentOldData).length !== 0) {
                const scrobble_data = {
                    listen_type: "single",
                    payload: [
                    {
                        listened_at: currentOldData.listenedAt,
                        track_metadata: {
                            additional_info: {
                                media_player: "Apple Music",
                                submission_client: "Apple Music",
                                music_service: "music.apple.com",
                                duration_ms: currentOldData.attributes.durationInMillis,
                                origin_url: currentOldData.attributes.url,
                            },
                            artist_name: currentOldData.attributes.artistName,
                            track_name: currentOldData.attributes.name,
                        },
                    },
                    ],
                };

                const request2 = new Request(`${cfg.url}/1/submit-listens`, {
                    method: "POST",
                    body: JSON.stringify(scrobble_data),
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Token ${cfg.apiKey}`,
                    },
                });
                await fetch(request2);
            }
        })
    },
} as PluginAPI