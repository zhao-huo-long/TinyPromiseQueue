export declare type AbortFn = (...arg: unknown[]) => unknown;
export declare type PromiseFactory = () => Promise<unknown> | [Promise<unknown>, AbortFn | undefined];
export declare type Pending = {
    readonly promise: Promise<unknown>;
    readonly abort?: AbortFn;
};
export declare type ErrorPolicy = 'abort' | 'ignore';
export default class TinyPromiseQueue {
    private factoryArr;
    private readonly cap;
    private readonly errorPolicy;
    private pending;
    private isAbort;
    constructor(factoryArr?: PromiseFactory[], cap?: number, errorPolicy?: ErrorPolicy);
    readonly abort: () => void;
    private next;
    private readonly wrapper;
    private readonly execte;
    readonly start: () => void;
}
