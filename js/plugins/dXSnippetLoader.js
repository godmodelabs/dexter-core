/**
 * Get the config of this application the required
 * views and pre load every template for them.
 *
 * @author: Riplexus <riplexus@gmail.com>
 */

define([
    'dX/libs/debug',
    'json!configs/dX.json'
], function(
    debug,
    config
) {

    debug = debug('DX');

    var list = [];

    return {
        load: function(resourceId, require, load, conf) {
            if (conf.isBuild) { return load(); }

            if (list.length) {
                load(list);
                return;
            }

            for (var i=0, l=config.snippets.length; i<l; i++) {
                list.push('text!snippets/'+config.snippets[i]);
            }

            debug.yellow('register snippets:\n     '+list.join(',\n     '));
            require(list, function() {
                load(Array.prototype.slice.call(arguments, 0));
            });
        }
    };

});