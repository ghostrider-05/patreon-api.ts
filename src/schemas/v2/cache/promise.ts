import type { If } from '../../../utils/'

export type IfAsync<IsAsync extends boolean, T> = If<IsAsync, Promise<T>, T>

export class PromiseManager<IsAsync extends boolean> {
    public constructor (
        protected async: IsAsync,
    ) {}

    public consume <T, R>(result: IfAsync<IsAsync, T>, consume: (result: T) => R): IfAsync<IsAsync, R> {
        if (this.async) {
            return (result as Promise<T>).then(resolved => consume(resolved)) as IfAsync<IsAsync, R>
        } else {
            return consume(<T>result) as IfAsync<IsAsync, R>
        }
    }

    public all <T>(result: IfAsync<IsAsync, T>[]): IfAsync<IsAsync, T[]> {
        if (this.async) {
            return Promise.all(result as Promise<T>[]) as IfAsync<IsAsync, T[]>
        } else {
            return <T>result as IfAsync<IsAsync, T[]>
        }
    }

    public chain <T, R>(result: Promise<T> | T, consume: (result: T) => R): R {
        return this.consume<T, R>(<never>result, consume) as R
    }
}
