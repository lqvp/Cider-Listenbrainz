import { Ref, ref, watch } from "vue";
import { useCider } from "@ciderapp/pluginkit";
import { clone, merge } from 'lodash'
import config from './plugin.config'

/**
 * Setup the configuration section for the plugin in the Cider config.
 * @param defaults The default configuration for the plugin.
 * @returns Usable configuration object.
 */
function setupConfig<T extends Record<string, any>>(defaults: T): Ref<T> {
    const cfg = { ...defaults };
    const cider = useCider();
    // @ts-ignore
    const appConfig = cider.config.getRef();
    const { identifier } = config;

    if (!appConfig['plugins']) {
        appConfig['plugins'] = {};
    }
    if (!appConfig['plugins'][identifier]) {
        appConfig['plugins'][identifier] = {};
    }

    const pluginConfig = appConfig['plugins'][identifier];
    appConfig['plugins'][identifier] = merge(cfg, pluginConfig);

    const cfgRef = ref(clone(appConfig['plugins'][identifier]));

    watch(cfgRef, (newVal) => {
        appConfig['plugins'][identifier] = newVal;
    }, {
        deep: true,
    })

    return cfgRef as Ref<T>;
}

export const cfg = setupConfig({
    url: <string>'https://api.listenbrainz.org',
    apiKey: <string>'',
    useAppleMusicClientName: <boolean>true,
    enabled: <boolean>false,
});

export function useConfig() {
    return cfg.value;
}