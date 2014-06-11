var HashKeySanidator = require('./hashKeySanidator')

// This object is responsible for validating and sanitizing a hash with a set
// of attributes by a given set of rules, and then return error messages
var HashSanidator = module.exports = function (hash, options) {
    this.hash = hash
    this.options = options || {}
    this.errors = {}
    this._nestedInstances = {}
    this._validatedAttributes = {}
}

HashSanidator.prototype = {

    /**
     * Rules
     */

    // Sets validation rules
    rules:function (rules) {
        if (typeof rules == 'object') {
            for (var param in rules) {
                this.rule(param, rules[param])
            }
        } else if (typeof rules == 'function') {
            rules.call(this, this.hash)
        } else {
            throw 'invalid_sanidation_rules'
        }
        return !this.hasErrors()
    },

    // Adiciona uma única regra de validação
    rule:function (param, rule) {
        // Multiple parameters at once
        if (param instanceof Array) {
            return param.forEach((function (p) {
                this.rule(p, rule)
            }).bind(this))
        }
        this._validatedAttributes[param] = true
        var sanidator = this.sanidate(param, rule)
        if (sanidator.error) {
            this.err(param, sanidator.error)
            return false
        }
        return true
    },

    /**
     * Validation
     */

    // Valida e sanitiza um parâmetro com uma regra
    sanidate:function (param, rule) {
        return new HashKeySanidator(this, param).sanidate(rule);
    },

    /**
     * Error control
     */

    // Reseta o estado de erro deste objeto
    clearErrors:function () {
        this.errors = {}
    },

    // Adiciona um erro de validação ao request
    err:function (param, msg) {
        if (this.options.err) return this.options.err(param, msg)
        this.errors[param] = msg
    },

    // Indica se há erro de validação
    hasErrors:function () {
        if (!this.errors) return false
        for (var e in this.errors) {
            return true
        }
        return false
    },

    hasError:function (param) {
        return this.errors && this.errors[param]
    },

    getErrorsAsArray:function () {
        var arr = []
        for (var name in this.errors) {
            arr.push(name + ": "+ this.errors[name])
        }
        return arr
    },

    /**
     * Nested Sanidators
     */
    _nestedInstances:null,
    filterUnvalidatedAttributes:function (raise) {
        for (var key in this.hash) {
            if (!this._validatedAttributes[key]) {
                if (raise) this.err(key, 'unexpected_data')
                else
                    delete this.hash[key]
            }
        }
        for (var key in this._nestedInstances)
            this._nestedInstances[key].filterUnvalidatedAttributes()
    }

}