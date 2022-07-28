var TinyPromiseQueue = /** @class */ (function () {
    function TinyPromiseQueue(factoryArr, cap, errorPolicy) {
        if (factoryArr === void 0) { factoryArr = []; }
        if (cap === void 0) { cap = 4; }
        if (errorPolicy === void 0) { errorPolicy = 'abort'; }
        var _this = this;
        this.factoryArr = factoryArr;
        this.cap = cap;
        this.errorPolicy = errorPolicy;
        this.pending = [];
        this.isAbort = false;
        this.abort = function () {
            _this.isAbort = true;
            _this.pending.forEach(function (i) { var _a; return (_a = i.abort) === null || _a === void 0 ? void 0 : _a.call(i); });
            _this.pending = [];
        };
        this.next = function (promise) {
            if (_this.isAbort)
                return;
            _this.pending = _this.pending.filter(function (item) { return item.promise !== promise; });
            var nextFn = _this.factoryArr.pop();
            _this.execte(nextFn);
        };
        this.wrapper = function (promise) {
            promise
                .then(function (res) {
                setTimeout(function () {
                    _this.next(promise);
                });
                return res;
            })
                .catch(function (err) {
                if (_this.errorPolicy === 'abort') {
                    _this.abort();
                }
                if (_this.errorPolicy === 'ignore') {
                    setTimeout(function () {
                        _this.next(promise);
                    });
                }
                return err;
            });
        };
        this.execte = function (fn) {
            var result = fn === null || fn === void 0 ? void 0 : fn();
            if (!result)
                return;
            if (Array.isArray(result)) {
                var promise = result[0], abort = result[1];
                _this.wrapper(promise);
                _this.pending.push({
                    promise: promise,
                    abort: abort
                });
            }
            if (result instanceof Promise) {
                _this.wrapper(result);
                _this.pending.push({
                    promise: result
                });
            }
        };
        this.start = function () {
            var cap = _this.cap;
            _this.isAbort = false;
            var fnArr = _this.factoryArr.splice(0, cap);
            for (var _i = 0, fnArr_1 = fnArr; _i < fnArr_1.length; _i++) {
                var fn = fnArr_1[_i];
                _this.execte(fn);
            }
        };
    }
    return TinyPromiseQueue;
}());
export default TinyPromiseQueue;
