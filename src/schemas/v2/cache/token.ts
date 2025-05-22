import type { Oauth2StoredToken } from '../../../rest/v2/'

import type { CacheStoreBinding } from './base'

import { CacheStoreBindingMemory } from './bindings/'

import {
    PromiseManager,
    type IfAsync,
} from './promise'

export interface CacheTokenStoreOptions {
    patchUnknownItem?: boolean
}

export class CacheTokenStore<IsAsync extends boolean> {
    private promise: PromiseManager<IsAsync>

    public binding: CacheStoreBinding<IsAsync, Oauth2StoredToken>
    public options: Required<CacheTokenStoreOptions>

    public static createSync(
        binding?: CacheStoreBinding<false, Oauth2StoredToken>,
        options?: CacheTokenStoreOptions,
    ) {
        return new CacheTokenStore(false, binding, options)
    }

    public static createAsync(
        binding?: CacheStoreBinding<true, Oauth2StoredToken>,
        options?: CacheTokenStoreOptions,
    ) {
        return new CacheTokenStore(true, binding, options)
    }

    public constructor (
        protected async: IsAsync,
        binding?: CacheStoreBinding<IsAsync, Oauth2StoredToken>,
        options?: CacheTokenStoreOptions,
    ) {
        this.binding = binding ?? (new CacheStoreBindingMemory<Oauth2StoredToken>({
            convert: {
                fromKey: (key) => ({ id: key, type: 'client' }),
                toKey: ({ id }) => id,
            }
        }) as unknown as CacheStoreBinding<IsAsync, Oauth2StoredToken>)
        this.promise = new PromiseManager(async)

        this.options = {
            patchUnknownItem: options?.patchUnknownItem ?? true,
        }
    }

    public delete(userId: string): IfAsync<IsAsync, void> {
        return this.binding.delete(userId)
    }

    public put(userId: string, token: Oauth2StoredToken): IfAsync<IsAsync, void> {
        return this.binding.put(userId, token)
    }

    public get(userId: string): IfAsync<IsAsync, Oauth2StoredToken | undefined> {
        return this.binding.get(userId)
    }

    public edit(userId: string, value: Partial<Oauth2StoredToken>) {
        return this.promise.consume(this.get(userId), (item) => {
            if (item == undefined && !this.options.patchUnknownItem) return undefined
            const merged = { ...(item ?? {}), ...value } as Oauth2StoredToken

            return this.promise.chain(this.put(userId, merged), () => {
                return merged
            })
        })
    }

    public bulkPut(items: { key: string; value: Oauth2StoredToken }[]): IfAsync<IsAsync, void> {
        if (this.binding.bulkPut != undefined) {
            return this.binding.bulkPut(items)
        }

        return this.promise.consume(this.promise.all(items.map(({ key, value }) => {
            return this.binding.put(key, value)
        })), () => {})
    }

    public bulkGet(userIds: string[]): IfAsync<IsAsync, ({ id: string, value: Oauth2StoredToken } | undefined)[]> {
        if (this.binding.bulkGet != undefined) {
            return this.binding.bulkGet(userIds)
        }

        return this.promise.consume(this.promise.all(userIds.map(userId => {
            return this.promise.consume(this.get(userId), value => {
                return value ? { value, id: userId } : undefined
            })
        })), result => result)
    }

    public bulkDelete(userIds: string[]): IfAsync<IsAsync, void> {
        if (this.binding.bulkDelete != undefined) {
            return this.binding.bulkDelete(userIds)
        }

        return this.promise.consume(this.promise.all(userIds.map(userId => {
            return this.delete(userId)
        })), () => {})
    }
}
