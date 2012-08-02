module.exports = function (Sanidator) {

    Sanidator.setFilters({

        str:function (v) {
            this.val(v.toString());
        },

        array:function (v) {
            if (!(v instanceof Array)) this.err('array_expected');
        },

        // Garante que é um inteiro
        int:function (v, d) {

        },

        notnull:function (v) {
            if (typeof v == 'undefined' || v === null) {
                this.err('notnull');
            }
        },

        // Remove espaços em branco
        trim:function (v) {
            this.val(v.trim());
        },

        // Garante um tamanho
        len:function (v, d, min, max) {
            if (max === undefined) {
                if (v.length != min) {
                    this.err('invalid_len');
                }
            } else {
                if (v.length < min || (max != null && v.length > max)) {
                    this.err('invalid_len');
                }
            }
        },

        // Validação com callbacks

        func:function (v, d, func) {
            func.call(this, v, d)
        },

        each:function (v, d, func) {
            for (var i = 0; i < v.length; i++) {
                if (func.call(this, v[i]) !== true && this.error) {
                    return;
                }
            }
        }

    });

}