import { defineCustomElement } from "./utils/CustomElement/apiCustomElement.ts";
import { PluginAPI, useMusicKit } from "@ciderapp/pluginkit";
import settings from "./components/settings.vue";
import { customElementName } from "./utils";
import config from './plugin.config.ts'
import { createApp, h } from 'vue'
import { createPinia } from "pinia";

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

        function constructSongUrl(item: any) {
            if (item.url && item.url.appleMusic) {
              return item.url.appleMusic;
            }
            const playParams = item.attributes?.playParams;
            if (playParams) {
              if (playParams.catalogId && /^\d+$/.test(playParams.catalogId)) {
                return `https://music.apple.com/jp/song/${playParams.catalogId}`;
              }
              if (playParams.id && playParams.kind === 'song') {
                const songId = playParams.id.split('/').pop();
                if (/^\d+$/.test(songId)) {
                  return `https://music.apple.com/jp/song/${songId}`;
                }
              }
            }
            if (item.id && /^\d+$/.test(item.id)) {
              return `https://music.apple.com/jp/song/${item.id}`;
            }
            if (item.attributes?.isrc) {
              return `https://music.apple.com/search?isrc=${item.attributes.isrc}`;
            }
            if (item.attributes?.name && item.attributes?.artistName) {
              const encodedQuery = encodeURIComponent(`${item.attributes.name} ${item.attributes.artistName}`);
              return `https://music.apple.com/search?term=${encodedQuery}`;
            }
            return null;
          }

        /**
         * Build track_metadata object from a MusicKit media item
         * Extracts all available fields and conditionally includes them in the payload
         */
        function buildTrackMetadata(item: any, clientName: string) {
            const attrs = item.attributes || {};
            
            // Build additional_info object with all available fields
            const additional_info: any = {
                media_player: clientName,
                submission_client: clientName,
                submission_client_version: config.version,
                music_service: "music.apple.com",
            };

            // Add duration if available
            if (attrs.durationInMillis) {
                additional_info.duration_ms = attrs.durationInMillis;
            }

            // Add origin URL
            const originUrl = constructSongUrl(item);
            if (originUrl) {
                additional_info.origin_url = originUrl;
            }

            // Add track number as string
            if (attrs.trackNumber) {
                additional_info.tracknumber = String(attrs.trackNumber);
            }

            // Add ISRC
            if (attrs.isrc) {
                additional_info.isrc = attrs.isrc;
            }

            // Add genre tags
            if (attrs.genreNames && Array.isArray(attrs.genreNames) && attrs.genreNames.length > 0) {
                additional_info.tags = attrs.genreNames;
            }

            // Build track_metadata object
            const track_metadata: any = {
                additional_info,
                artist_name: attrs.artistName || "Unknown Artist",
                track_name: attrs.name || "Unknown Track",
            };

            // Add release name (album)
            if (attrs.albumName) {
                track_metadata.release_name = attrs.albumName;
            }

            return track_metadata;
        }

        musickit.addEventListener('playbackStateDidChange', async () => {
            const cfg = useConfig();
            if (!cfg.enabled) return;
            let currentOldData = oldData;
            const currentItem = musickit.nowPlayingItem;

            if (Object.keys(currentOldData).length === 0) return;

            if (!currentItem && musickit.queue._nextPlayableItemIndex === -1) {
                const clientName = cfg.useAppleMusicClientName ? "Apple Music" : "Cider";
                const scrobble_data = {
                    listen_type: "single",
                    payload: [
                    {
                        listened_at: currentOldData.listenedAt,
                        track_metadata: buildTrackMetadata(currentOldData, clientName),
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

            if (!currentItem) return;
            if (Object.keys(currentOldData).length > 0 && currentItem.id === currentOldData.id) return;

            oldData = musickit.nowPlayingItem;
            oldData.listenedAt = Math.floor(new Date().getTime() / 1000);

            const clientName = cfg.useAppleMusicClientName ? "Apple Music" : "Cider";
            const playing_data = {
                listen_type: "playing_now",
                payload: [
                  {
                    track_metadata: buildTrackMetadata(currentItem, clientName),
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
                const clientName = cfg.useAppleMusicClientName ? "Apple Music" : "Cider";
                const scrobble_data = {
                    listen_type: "single",
                    payload: [
                    {
                        listened_at: currentOldData.listenedAt,
                        track_metadata: buildTrackMetadata(currentOldData, clientName),
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