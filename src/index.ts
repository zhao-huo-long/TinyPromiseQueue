export type AbortFn = (...arg: unknown[]) => unknown

export type PromiseFactory = () => Promise<unknown> | [Promise<unknown>, AbortFn | undefined]

export type Pending = {
  readonly promise: Promise<unknown>
  readonly abort?: AbortFn
}

export type ErrorPolicy = 'abort' | 'ignore'

export default class TinyPromiseQueue {

  private pending: Pending[] = []
  private isAbort = false

  constructor(
    private factoryArr: PromiseFactory[] = [],
    private readonly cap = 4,
    private readonly errorPolicy: ErrorPolicy = 'abort'
  ) {}

  readonly abort = () => {
    this.isAbort = true
    this.pending.forEach(i => i.abort?.())
    this.pending = []
  }

  private next = (promise: Promise<unknown>) => {
    if (this.isAbort) return
    this.pending = this.pending.filter(item => item.promise !== promise);
    const nextFn = this.factoryArr.pop()
    this.execte(nextFn)
  }

  private readonly wrapper = (promise: Promise<unknown>) => {
    promise
      .then(res => {
        setTimeout(() => {
          this.next(promise)
        })
        return res
      })
      .catch(err => {
        if (this.errorPolicy === 'abort') {
          this.abort()
        }
        if (this.errorPolicy === 'ignore') {
          setTimeout(() => {
            this.next(promise)
          })
        }
        return err
      })
  }

  private readonly execte = (fn: PromiseFactory) => {
    const result = fn?.()
    if (!result) return
    if (Array.isArray(result)) {
      const [promise, abort] = result
      this.wrapper(promise)
      this.pending.push({
        promise,
        abort
      })
    }
    if (result instanceof Promise) {
      this.wrapper(result)
      this.pending.push({
        promise: result
      })
    }
  }

  readonly start = () => {
    const { cap } = this
    this.isAbort = false
    const fnArr = this.factoryArr.splice(0, cap)
    for(const fn of fnArr){
      this.execte(fn)
    }
  }
}