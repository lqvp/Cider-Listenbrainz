import { createId } from "@paralleldrive/cuid2"

export default {
    ce_prefix: createId(),
    identifier: 'ch.lqvp.listenbrainz',
    name: 'ListenBrainz-Custom',
    description: 'Plugin to submit listening data to ListenBrainz.',
    version: '1.1.2',
    author: 'lqvp',
    repo: 'https://github.com/lqvp/cider-listenbrainz',
    entry: {
        'plugin.js': {
            type: 'main',
        }
    }
}