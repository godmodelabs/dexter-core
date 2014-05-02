/**
 * A require.js plugin to require shims, if needed. If
 * a clients browser doesn't support a function, it can
 * be loaded for that user with this plugin, thanks to
 * modernizr.
 *
 * @author Riplexus <riplexus@gmail.com>
 */

define(function() {
    var window = this,
        exists;

    exists = function(name) {
        var vars, cur, scope, i, l;

        vars = name.split('.');
        scope = window;

        for (i=0, l=vars.length; i<l; i++) {
            cur = vars[i];
            if (cur in scope && !!scope[cur]) {
                scope = scope[vars[i]];
            } else {
                return false;
            }
        }
        return true;
    };

    return {
        load: function(name, require, load) {
            if (!exists(name)) {
                require([
                    'libs/shims/'+name
                ], function() {
                    load();
                });

            } else {
                load();
            }
        }
    };

});