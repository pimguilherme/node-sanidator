/**
 * Validator and Sanitizer for Node and Client-Side sharing
 */

module.exports = {
    HashSanidator:require('./hashSanidator'),
    Sanidator:require('./sanidator')
};

// Default filters
module.exports.Sanidator.setFilters(require('./filters'));
