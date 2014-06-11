var HashKeySanidator = require('./hashKeySanidator')

/**
 * Simple value sanidation
 */
var Sanidator = module.exports = function (v) {
    this.value = v
}

Sanidator.prototype = {

    // Defines the error message for this validation
    err:function (msg) {
        this.error = (this.overrideError || msg || 'invalid_value')
        throw this.error
    },

    // Skips all other validations
    skip:function () {
        this.skipped = true
        throw 'skipping_other_validations'
    },

    // Overrides next error message
    msg:function (msg) {
        this.overrideError = msg
        return this;
    },

    // Either defines or returns the value being sanitized
    val:function (v) {
        if (v === undefined) return this.value
        this.value = v
    }
}

/**
 * Filters
 */

Sanidator.filters = {}
// Sets a filter for the sanidator
Sanidator.setFilter = function (name, func) {

    Sanidator.filters[name] = function (v, a, b, c) {
        var vs = new Sanidator(v)
        try {
            return func.call(vs, v, a || {}, b, c)
        } catch (e) {
            if (vs.error || vs.skipped) {
                return vs.error
            } else {
                throw e
            }
        }
    }

    HashKeySanidator.prototype[name] = Sanidator.prototype[name] = function (a, b, c) {
        var error = func.call(this, this.value, a || {}, b, c)
        if (error) {
            this.err(typeof error == 'string' ? error : undefined)
        }
//        this.overrideError = undefined
        return this;
    }

};

Sanidator.setFilters = function (filters) {
    for (var name in filters) {
        Sanidator.setFilter(name, filters[name]);
    }
}
