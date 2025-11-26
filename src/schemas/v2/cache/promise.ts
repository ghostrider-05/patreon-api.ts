import type { If } from '../../../utils/'

export type IfAsync<IsAsync extends boolean, T> = If<IsAsync, Promise<T>, T>

export class PromiseManager<IsAsync extends boolean> {
    public constructor (
        protected async: IsAsync,
    ) {}

    public consume <T, R>(result: IfAsync<IsAsync, T>, consume: (result: T) => R): IfAsync<IsAsync, R> {
        if (this.async) {
            // the result of an async storage operation can be something else then a promise
            // For bindings that accept async, but they can be sync too
            return Promise.resolve<T>(result).then(resolved => consume(resolved)) as IfAsync<IsAsync, R>
        } else {
            // Assume that if the storage is sync, do not await at all
            return consume(<T>result) as IfAsync<IsAsync, R>
        }
    }

    public all <T>(result: IfAsync<IsAsync, T>[]): IfAsync<IsAsync, T[]> {
        if (this.async) {
            return Promise.all(result.map(item => Promise.resolve(item))) as IfAsync<IsAsync, T[]>
        } else {
            return <T>result as IfAsync<IsAsync, T[]>
        }
    }

    public chain <T, R>(result: Promise<T> | T, consume: (result: T) => R): R {
        return this.consume<T, R>(<never>result, consume) as R
    }
}
