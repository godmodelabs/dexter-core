/**
 * Get the config of this application the required
 * views and pre load every template for them.
 *
 * @author: Riplexus <riplexus@gmail.com>
 */

define([
    'dX/libs/debug',
    'dX/libs/unique',
    'dX/ViewLoader!',
    'dX/Shim!Object.keys'
], function(
    debug,
    unique,
    viewList
) {

    debug = debug('DX');

    var templateList = [];

    return {
        load: function(resourceId, require, load, config) {
            if (config.isBuild) { return load(); }

            var name;

            if (templateList.length) {
                load(templateList);
                return;
            }

            for (name in viewList) {
                if (viewList.hasOwnProperty(name)) {
                    templateList.push('text!templates/'+viewList[name].prototype.dXPath+'.html');
                }
            }

            debug.yellow('register templates:\n     '+templateList.join(',\n     '));
            require(templateList, function() {
                load(Array.prototype.slice.call(arguments, 0));
            });
        }
    };

});