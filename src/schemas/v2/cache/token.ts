import type { Oauth2StoredToken } from '../../../rest/v2/'

import type { CacheStoreBinding } from './base'

import {
    CacheStoreShared,
    type CacheStoreSharedOptions,
} from './shared'

export class CacheTokenStore<IsAsync extends boolean> extends CacheStoreShared<IsAsync, Oauth2StoredToken> {
    public constructor (
        async: IsAsync,
        binding?: CacheStoreBinding<IsAsync, Oauth2StoredToken>,
        options?: CacheStoreSharedOptions,
    ) {
        super(async, binding, options)
    }
}
