/**
 * Get every view mentioned at dXViews.conf.js.
 *
 * @author: Riplexus <riplexus@gmail.com>
 */

define([
    'underscore',
    'configs/dXViews.conf',
    'dX/libs/debug',
    'dX/libs/is',
    'dX/Shim!Object.keys'
], function(
    _,
    dXViews,
    debug,
    is
) {

    var log = debug('DX');

    /**
     * Returns the values of the provided object.
     *
     * @param obj
     * @returns {Array}
     * @source http://stackoverflow.com/a/15113739/795605
     * @ignore
     */

    Object.values = function (obj) {
        var vals = [], key;
        for( key in obj ) {
            if ( obj.hasOwnProperty(key) ) {
                vals.push(obj[key]);
            }
        }
        return vals;
    };

    /**
     * This uniques an array containing view paths by the view name.
     * The first, most specific path has priority.
     *
     * @param arr
     * @returns {Array}
     * @ignore
     */

    function specialUnique(arr) {
        var u = {}, o = {}, i, l, str, key;

        for(i = 0, l = arr.length; i < l; ++i) {
            str = arr[i].split('/');
            key = str[str.length-1];

            if(u.hasOwnProperty(key) &&
                u[key] >= str.length) { continue; }

            u[key] = str.length;
            o[key] = arr[i];
        }

        return Object.values(o);
    }

    /**
     * Iterate over every view, set the dXType and dXPath for every view
     * according to their position in the view hierarchy.
     *
     * @param {Array} list
     * @param {object} views
     * @param {Array} viewPaths
     * @param {number} [level]
     */

    function markViews(list, views, viewPaths, level) {
        var i, name, subViewList;
        if (!level) { level = 1; }

        subViewList = [];
        for (i=list.length; i--;) {
            name = list[i];

            if (!(name in views)) { continue; }

            subViewList = subViewList.concat(views[name].prototype.dXSubViews);
            subViewList = removeSystem(subViewList);

            if (level === 1) {
                views[name].prototype.dXPath = viewPaths[i].replace('views/', '');
            }

            if (level > 1) {
                views[name].prototype.dXType = 'subview';
            }
        }

        if (subViewList.length > 0) {
            markViews(subViewList, views, viewPaths, ++level);
        }
    }

    /**
     * Returns the appropriate view name for the user.
     * If any system specific declarations are set, check the user os
     * via dX/libs/is. If the test fails, omit the keyword (e.g. android).
     *
     * @param name
     * @returns {string}
     * @ignore
     */

    function checkSystem(name) {
        var system = name.match(/([^!]+)![^!]+/)
        if (system) {
            system = system[1].split('/');
            system = system.pop();

            name = name.replace(new RegExp(system+'!', 'g'),
                is.hasOwnProperty(system) &&
                    is[system]()? system+'/' : '');
        }

        return name;
    }

    /**
     * Remove any system declarations.
     *
     * @param {Array} viewNames
     */

    function removeSystem(viewNames) {
        for (var i=viewNames.length; i--;) {
            viewNames[i] = viewNames[i].replace(/[^\/!]+!/g, '');
        }
        return viewNames;
    }

    /**
     * Return a require.js plugin which loads every view
     * (static, routed, subViews and item views) and returns
     * the view objects for further instantiation.
     *
     * It manages the real paths for the views by setting the dXPath
     * and dXSubViewPaths values to the view prototypes (move this
     * to another location maybe?)
     */

    return {
        load: function(resourceId, require, load, config) {
            if (config.isBuild) {
                load();
                return;
            }

            var viewPaths, res, views;

            viewPaths = [];
            views = {};

            // Create view paths, resolve system declarations
            _.each(dXViews, function(target) {
                if (_.isArray(target)) {
                    _.each(target, function(view) {
                        viewPaths.push('views/'+checkSystem(view));
                    });

                } else {
                    viewPaths.push('views/'+checkSystem(target));
                }
            });

            viewPaths = specialUnique(viewPaths);

            require(viewPaths, function() {
                res = Array.prototype.slice.call(arguments, 0);

                for(i in res) {
                    if (!res.hasOwnProperty(i)) { continue; }
                    views[res[i].prototype.dXName] = res[i];
                    res[i].prototype.dXViewList = views;
                }

                markViews(Object.keys(views), views, viewPaths);

                log.yellow('registered views:\n     '+viewPaths.join(',\n     '));
                load(views);
            });
        }
    };
});