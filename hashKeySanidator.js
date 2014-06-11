// Validates and sanitizes a key in a HashSanidator
var HashKeySanidator = module.exports = function (hashSanidator, name) {
    this.name = name
    this.hash = hashSanidator.hash
    this.hashSanidator = hashSanidator
    this.value = this.hash[this.name]
}

HashKeySanidator.prototype = {

    // Applies a rule with filters to the value being validated
    sanidate:function (rule) {
        if (typeof rule == 'object') {
            var r = rule
            rule = function () {
                this.rules(r)
            }
        }
        if (typeof rule == 'function') {
            try {
                var error = rule.call(this, this.hash[this.name], this.hash);
            } catch (e) {
                if (this.error || this.skipped) {
                    return this
                } else {
                    throw e
                }
            }
            if (typeof error == 'string') {
                this.error = error
            }
        }
        return this;
    },

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

    overrideError:null,
    // Overrides next error message
    msg:function (msg) {
        this.overrideError = msg
        return this;
    },

    // Either defines or returns the value being sanitized
    val:function (v) {
        if (v === undefined) return this.hash[this.name]
        this.value = this.hash[this.name] = v
        return this;
    },

    nestedSanidator:function () {
        var self = this
        if (!this.hashSanidator._nestedInstances[this.name]) {
            this.hashSanidator._nestedInstances[this.name] =
                new (require('./hashSanidator'))(
                    this.val(),
                    {
                        err:function (param, msg) {
                            self.hashSanidator.err(self.name + '.' + param, msg)
                        }
                    }
                )
        }
        return this.hashSanidator._nestedInstances[this.name]
    }

}