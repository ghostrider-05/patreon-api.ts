export interface Storage<Data> {
    save(data: Data): Promise<void>
    deleteItem(id: string): Promise<void>
    fetchItem(id: string): Promise<Data | null>
    fetchItems(): Promise<Data[]>
}

export interface EditStorage<Data> extends Storage<Data> {
    edit(id: string, data: Partial<Data>): Promise<void>
}

/**
 *
 * @param env
 * @param options
 * @param config
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getStorage <Store extends Storage<any>>(
    env: Config.Env,
    options: Record<'type' | 'env', string>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    config: Record<'kv' | 'd1', (storage: any) => Store | undefined>,
): Store | undefined {
    const storage = env[options.env]
    if (!storage) throw new Error('No storage found in environment with name: ' + options.env)

    switch (options.type) {
    case 'kv':
        return config.kv(storage)
    case 'd1':
        return config.d1(storage)
    default: {
        console.log('Not using message storage since type is invalid. Must be one of: kv, d1. Received: ' + options.env)
        return undefined
    }
    }
}

interface PostData extends Record<string, string> {
    postId: string
    messageId: string
}

class KvPostStorage implements Storage<PostData> {
    public constructor (public kv: KVNamespace) {}

    async deleteItem(postId: string): Promise<void> {
        await this.kv.delete(postId)
    }

    async save(data: PostData): Promise<void> {
        await this.kv.put(data.postId, data.messageId, {
            metadata: data,
        })
    }

    async fetchItem(postId: string): Promise<PostData | null> {
        return await this.kv.getWithMetadata<PostData>(postId)
            .then(result => result.metadata)
    }

    async fetchItems(options?: KVNamespaceListOptions): Promise<PostData[]> {
        const data = await this.kv.list<PostData>(options)

        return data.keys
            .map(key => key.metadata)
            .filter(data => data != undefined)
    }
}

class D1PostStorage implements Storage<PostData> {
    public constructor (public db: D1Database) {}

    private convert (post: Record<string, string>): PostData {
        return {
            messageId: post.message_id,
            postId: post.post_id
        }
    }

    async fetchItem(postId: string): Promise<PostData | null> {
        const stmt = this.db.prepare('SELECT * FROM posts WHERE post_id = ?1').bind(postId)

        return await stmt.all<PostData>().then(result => this.convert(result.results[0]))
    }

    async save(data: PostData): Promise<void> {
        await this.db.prepare('INSERT INTO posts (post_id, message_id) VALUES (?1, ?2)')
            .bind(data.postId, data.messageId)
            .run()
    }

    async deleteItem (postId: string): Promise<void> {
        await this.db.prepare('DELETE FROM posts where post_id = ?1')
            .bind(postId)
            .run()
    }

    async fetchItems(): Promise<PostData[]> {
        const stmt = this.db.prepare('SELECT * FROM posts')

        return await stmt.all<PostData>().then(result => result.results.map(this.convert))
    }
}

/**
 *
 * @param config
 * @param env
 */
export function getMessageStorage (config: Config.WebhookMessagePostConfig, env: Config.Env): Storage<PostData> | undefined {
    if (config.message_storage_env == undefined || config.message_storage_type == undefined) {
        if (config.delete_original_message || config.edit_original_message) {
            if (config.message_storage_env == undefined) {
                console.log('Not able to delete or edit original post messages. Missing a storage environment name')
            } else if (config.message_storage_type == undefined) {
                console.log('Not able to delete or edit original post messages. Missing a storage type, one of: kv, d1')
            }
        }

        return
    }

    return getStorage<Storage<PostData>>(env,
        { env: config.message_storage_env, type: config.message_storage_type },
        {
            kv: (options) => new KvPostStorage(options),
            d1: (options) => new D1PostStorage(options),
        }
    )
}

export interface MemberData {
    patreon_id: string
    discord_id: string
    discord_roles: string[]
    tiers: string[]
    active_patron: boolean
    follower: boolean
    last_charge: 'Paid' | 'Pending'
    until: string | null
}

class D1MemberStorage implements EditStorage<MemberData> {
    public constructor (public db: D1Database, public campaignId: string) {}

    async edit(patreonId: string, data: Partial<MemberData>): Promise<void> {
        await this.db.prepare('')
            .bind(this.campaignId, patreonId, data.discord_id)
            .run()
    }

    async fetchItem(patreonId: string): Promise<MemberData | null> {
        const stmt = this.db.prepare('SELECT * FROM ?1 WHERE patreon_id = ?2')
            .bind(this.campaignId, patreonId)

        return await stmt.all<MemberData>()
            .then(result => result.results[0])
    }

    async save(data: Omit<MemberData, 'campaign_id'>): Promise<void> {
        const keys = Object.keys(data)
        const stmt = `INSERT INTO ${this.campaignId} (${keys.join(', ')}) VALUES (${Array.from({ length: keys.length }, (_, i) => `?${i + 1}`).join(', ')})`

        await this.db.prepare(stmt)
            .bind(...keys.map(k => data[k]))
            .run()
    }

    async deleteItem (patreonId: string): Promise<void> {
        await this.db.prepare('DELETE FROM ?1 where patreon_id = ?2')
            .bind(this.campaignId, patreonId)
            .run()
    }

    async fetchItems(): Promise<MemberData[]> {
        const stmt = this.db.prepare('SELECT * FROM ?1').bind(this.campaignId)

        return await stmt.all<MemberData>()
            .then(result => result.results)
    }

}

/**
 *
 * @param env
 * @param name
 * @param campaignId
 */
export function getMemberStorage (env: Config.Env, name: string, campaignId: string): EditStorage<MemberData> | undefined {
    return getStorage<EditStorage<MemberData>>(env, { type: 'd1', env: name, }, {
        kv: () => undefined,
        d1: (db) => new D1MemberStorage(db, campaignId),
    })
}
