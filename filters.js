var slice = Array.prototype.slice;

module.exports = {

    /**
     * Primitive Types
     */

    // Indicates if we have an object
    obj:function (v) {
        if (typeof v !== 'object') {
            return 'object_expected'
        }
    },

    // Simply checks if it's a date or not
    isDate:function (v) {
        try {
            var date = new Date(v)
            if (date == 'Invalid Date') {
                return "date_expected"
            }
        } catch (e) {
            return "date_expected"
        }
    },

    // Checks if the value is a date and converts it to an object if possible
    date:function (v, options) {
        try {
            this.val(v = new Date(v))
            if (v == 'Invalid Date') {
                return "date_expected"
            }
        } catch (e) {
            return "date_expected"
        }

        if (!(v instanceof Date)) {
            return "date_expected"
        }

        // Advanced options
        if (options.notPast && v.getTime() < Date.now()) {
            return 'past_date_not_allowed'
        }
    },

    string:function (v, options) {
        if (typeof v != 'string') return 'string_expected'
        if (options.trim !== false) {
            v = v.trim()
            this.val(v)
        }
        if (options.len && options.len != v.length) return 'string_invalid_len, len=' + options.len
        if (options.max && options.max < v.length) return 'string_invalid_len, maxlen=' + options.max
        if (options.min && options.min > v.length) return 'string_invalid_len, minlen=' + options.min
        if (options.nullable === false && this.val() == "") return "string_not_empty"
    },

    array:function (v, options) {
        if (!(v instanceof Array)) return 'array_expected'
        // Array length validation
        if (options.len !== undefined && v.length != options.len) {
            return 'array_invalid_len, len=' + options.le
        } else {
            if (options.min !== undefined && v.length < options.min) {
                return 'array_min_len, expected ' + options.min
            }
            if (options.max !== undefined && v.length > options.max) {
                return 'array_max_len, expected ' + options.max
            }
        }
    },

    regexp:function (v, r) {
        if (!r.test(v)) return 'regexp_no_match, regexp=' + r.toString()
    },

    bool:function (v, options) {
        if (options.convert !== false) v = v === 'true' ? true : (v === 'false' ? false : v)
        this.val(v)
        if (typeof v != 'boolean') return 'boolean_expected'
    },

    number:function (v, options) {
        if (typeof v != 'number' || isNaN(v)) return 'number_expected'
        if (options.min != undefined && v < options.min) return 'lesser_than_min, min=' + options.min
        if (options.max != undefined && v > options.max) return 'greater_than_max, max=' + options.max
        if (options.step && ((v * 10000) % (options.step * 10000)) != 0) return 'invalid_number_step, step=' + options.step
    },

    int:function (v, options) {
        try {
            if (options.convert) {
                if (typeof v == 'string') {
                    var parsed = parseInt(parseFloat(v))
                    var replaced = v && v.replace(/^0+/, '')
                    if (parsed.toString() == replaced) {
                        this.val(parsed)
                    } else if(replaced == '') {
                        this.val(0)
                    }
                }
            }
            if (typeof this.val() != 'number' || isNaN(this.val())) {
                return 'integer_expected'
            }
        } catch (e) {
            return 'integer_expected'
        }
        this.number(options)
    },

    float:function (v, options) {
        if (options.convert !== false) this.val(parseFloat(v))
        this.number(options)
        if (options.fixed) this.val(parseFloat(this.val().toFixed(options.fixed)))
    },

    /**
     * Nullables
     */

    // falsy values are not accepted
    notnull:function (v) {
        if (v === undefined || v === null) return 'notnull'
    },

    // If the value is not given, it may be considered valid fast
    nullable:function (v, options) {
        if (options.convert && v === 'null') this.val(v = null)
        if (v === undefined || v === null) {
            if (options.default !== undefined) this.val(options.default)
            this.skip()
        }
    },

    'null':function (v) {
        if (v !== null) return 'null_expected';
    },

    /**
     * Date & Time
     */

    ISODateString:function (v) {
        this
            .msg('invalid_iso_date, expected YYYY-MM-DD')
            .regexp(/\d{4}-\d{2}-\d{2}/)
            .isDate()
            .msg()
    },

    integerTime:function (v, options) {
        this.msg('integer_time_expected')
            .int({convert:true})
            .msg()
            .int(options)
        var h = Math.floor(v / 100)
        if (h < 0 || h > 23 || v % 100 > 59) {
            return 'integer_time_expected'
        }
    },

    timezoneOffset:function () {
        this.int()
    },

    /**
     * Geo
     */

    lat:function () {
        this.msg('latitude_expected')
            .float({min:-90, max:90, fixed:7})
    },

    lng:function () {
        this.msg('longitude_expected')
            .float({min:-180, max:180, fixed:7})
    },

    latlng:function () {
        this
//            .msg('latlng_expected')
            .obj()
            .rule('lat', this.lat)
            .rule('lng', this.lng)
    },

    /**
     * Misc
     */

    // Indicates whether the value is a valid mongo ObjectId
    mongoId:function (v) {
        this
            .msg('mongoid_expected')
            .val(v.toString())
            .string({len:24})
    },

    mongoResource:function (v, f) {
        this.types({
            'string':function () {
                this.mongoId()
            },
            'object':f
        })
    },

    /**
     * Functions
     */

    'enum':function (v, set) {
        var found = 0;
        set.forEach(function (item) {
            if (item == v) return (found = true) && false;
        })
        if (!found) return 'invalid_enum, expected [' + set + ']';
    },

    func:function (v, func) {
        func.call(this, v)
    },

    /**
     * Logical
     */

    types:function (v, types, error) {
        var type = typeof v
        if (!types[type]) return error
        typeof types[type] == 'function' && types[type].apply(this, [v])
    },

    /**
     * Nested Rules
     */

    each:function (v, func, error) {
        this.array()
        var sanidator = this.nestedSanidator()
            , noError = true
        for (var i = 0; i < v.length; i++) {
            noError &= sanidator.rule(i, func)
        }
        if (!noError) return error
    },

    filter:function (v, func) {
        this.array()
        var sanidator = this.nestedSanidator()
        this.val(v.filter(func))
    },

    map:function (v, func) {
        this.array()
        var sanidator = this.nestedSanidator()
        this.val(v.map(func))
    },

    // Applies rules to the object as a nested Sanidator
    rule:function (v, param, rule) {
        this.nestedSanidator().rule(param, rule)
    },

    // Applies rules to the object as a nested Sanidator
    rules:function (v, f) {
        this.obj()
        this.nestedSanidator().rules(f)
    }

}