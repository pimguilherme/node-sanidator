/**
 * Validator and Sanitizer for Node and Client-Side sharing
 *
 * deps: sugarjs
 */

// Aceita como entrada um Object indexado por nome de parâmetros
var HashSanidator = function (hash, options) {
    options = options || {};
    // Parâmetros a serem validados
    this._hash = hash;
    if (options.profiles) {
        this.profiles = options.profiles;
    }
    this.clearErrors();
};

HashSanidator.prototype = {

    /**
     * Regras
     */

    // Configura regras de validação
    rules:function (rules) {
        // Regras baseadas nos pefis configurados
        if (typeof rules == 'string') {
            var profile = rules;
            rules = this.profiles && this.profiles[rules];
            if (!rules) throw new Error('Invalid validation profile: ' + profile);
        }
        for (var param in rules) {
            this.rule(param, rules[param])
        }
    },

    // Adiciona uma única regra de validação
    rule:function (param, rule) {
        var error = this.sanidate(param, rule);
        if (error) {
            return this.errors.params[param] = error;
        }
        return null;
    },

    /**
     * Validação
     */

    // Valida e sanitiza um parâmetro com uma regra
    sanidate:function (param, rule) {
        return new Sanidator(this._hash[param], this._hash).rule(rule).error;
    },

    /**
     * Controle de erros
     */

    // Reseta o estado de erro deste objeto
    clearErrors:function () {
        this.errors = {
            // Erros por parâmetro
            params:{},
            // Erros genéricos
            generic:[]
        };
    },

    // Adiciona um erro de validação ao request
    error:function (param, msg) {
        if (msg === undefined) return this.generic.push(param);
        this.errors[param] = msg;
    },

    // Indica se há erro de validação
    hasErrors:function () {
        if (this.errors.generic.length) return true;
        for (var e in this.errors.params) {
            return true;
        }
        return false;
    }

}

// Valida e sanitiza apenas um valor
// @data define outros dados necessários na validação
var Sanidator = function (value, data) {
    this.value = value;
    this.data = data;
}

Sanidator.prototype = {

    rule:function (rule) {
        if (typeof rule == 'function') {
            var ret = rule.call(this, this.value, this.data);
            if (typeof ret !== 'undefined') {
                this.value = ret;
            }
        }
        return this;
    },

    // Define a mensagem de erro
    err:function (msg) {
        this._error = msg || 'Invalid value';
        return this;
    },

    // Sobrepõe a última mensagem de erro
    msg:function (msg) {
        if (this._error) this._error = msg;
        return this;
    },

    // Define um novo valor para o elemento sendo sanidado
    val:function (v) {
        this.value = v;
        return this;
    }

}

// Atende uma lista de prioridades para escolher qual será o erro mostrado
Sanidator.prototype.__defineGetter__('error', function () {
    return this._error;
})

// Configura um filtro para o Sanidator
Sanidator.setFilter = function (name, func) {
    Sanidator.prototype[name] = function () {
        if (this._error) return this;
        func.apply(this, [this.value, this.data].concat(Array.prototype.splice.call(arguments, 0)));
        return this;
    }
};

// Configura múltiplos filtros de uma vez
Sanidator.setFilters = function (filters) {
    for (var name in filters) {
        Sanidator.setFilter(name, filters[name]);
    }
}

// Importamos os filtros padrões
require('./filters')(Sanidator);


module.exports = HashSanidator;
