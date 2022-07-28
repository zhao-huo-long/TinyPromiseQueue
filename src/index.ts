import Event from 'emitter-tiny'

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
  private readonly event = new Event()
  private readonly total: number = 0;
  private response: unknown[] = []
  public onProgress?: (p: { done: number, total: number }) => unknown

  constructor(
    private factoryArr: PromiseFactory[] = [],
    private readonly cap = 4,
    private readonly errorPolicy: ErrorPolicy = 'abort'
  ) {
    this.total = factoryArr.length
  }

  readonly abort = () => {
    this.isAbort = true
    this.pending.forEach(i => i.abort?.())
    this.pending = []
    this.event.emit('fail', new Error('you call the abort method.'))
  }

  private next = (promise: Promise<unknown>) => {
    if (this.isAbort) return
    this.pending = this.pending.filter(item => item.promise !== promise);
    this.onProgress?.({
      done: this.total - this.factoryArr.length - this.pending.length,
      total: this.total
    })
    const nextFn = this.factoryArr.shift()
    this.execte(nextFn)
  }

  private readonly wrapper = (promise: Promise<unknown>) => {
    promise
      .then(res => {
        this.response.push(res)
        setTimeout(() => {
          this.next(promise)
        })
        return res
      })
      .catch(err => {
        if (this.errorPolicy === 'abort') {
          this.abort()
          setTimeout(() => this.event.emit('fail', err))
        }
        if (this.errorPolicy === 'ignore') {
          this.response.push(err)
          setTimeout(() => {
            this.next(promise)
          })
        }
        return err
      })
  }

  private readonly execte = (fn: PromiseFactory) => {
    const result = fn?.()
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
    if (
      !this.pending.length
      && !this.factoryArr.length
    ) {
      this.event.emit('success', true)
    }
  }

  readonly start = () => {
    const { cap } = this
    this.isAbort = false
    this.factoryArr = [...this.factoryArr]
    const fnArr = this.factoryArr.splice(0, cap)
    for (const fn of fnArr) {
      this.execte(fn)
    }
    return new Promise<unknown>((res, rej) => {
      this.event.on('success', () => res(this.response))
      this.event.on('fail', (e) => rej(e))
    })
  }
}