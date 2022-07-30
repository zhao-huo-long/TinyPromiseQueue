### tiny-promise-queue
🚀🚀🚀 this is a promise-queue util!


#### install
```shell
npm i tiny-promise-queue
```

#### useage
```js
import PromiseQueue from 'tiny-promise-queue'

const PromiseFactoryArray = Array.from({length: 10})
  .map((i, index) => {
  return () => new Promise(res => {
    setTimeout(() => {
      const v = {index, v: Math.random()}
      res(v)
    }, Math.random() * 2000 + 1000)
  })
})

const queue = new PromiseQueue(PromiseFactoryArray, 4)
queue.onProgress = (p) => console.log(p)
queue.start().then(v => console.log(v))
```

#### api
```ts
export declare type AbortFn = (...arg: unknown[]) => unknown;
export declare type PromiseFactory = () => Promise<unknown> | [Promise<unknown>, AbortFn | undefined];
export declare type Pending = {
    readonly promise: Promise<unknown>;
    readonly abort?: AbortFn;
};
export declare type ErrorPolicy = 'abort' | 'ignore';
export default class TinyPromiseQueue {
    onProgress?: (p: {
        done: number;
        total: number;
    }) => unknown;
    constructor(factoryArr?: PromiseFactory[], cap?: number, errorPolicy?: ErrorPolicy);
    readonly abort: () => void;
    readonly start: () => Promise<unknown>;
}
```
