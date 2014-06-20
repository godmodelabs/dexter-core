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
     * Check the user system and replace any view
     * declaration, if defined.
     *
     * @param {Array} views
     * @returns {Array}
     */

    function resolveSystem(views) {
        var paths = {}, m, res = [], view;

        for (var i=views.length; i--;) {
            m = views[i].match(/[^\/!]+!/g);
            if (m) {
                m = m[0].substr(0, m[0].length -1);
                if (!paths[m]) { paths[m] = []; }
                paths[m].push(views[i].replace(/[^\/!]+!/g, ''));
            } else {
                res.push(views[i]);
            }
        }

        for (system in paths) {
            if (!paths.hasOwnProperty(system)) { continue; }
            if (is.hasOwnProperty(system) && is[system]()) {
                for (i=paths[system].length; i--;) {
                    view = paths[system][i];
                    res.push(system+'/'+view);
                    var j = res.indexOf(view);
                    if (j !== -1) { res.splice(j, 1); }
                }
            }
        }

        return res;
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

            var viewPaths, viewNames, res, views, i;

            viewPaths = [];
            viewNames = [];
            views = {};

            // Create view paths, resolve system declarations
            viewPaths = _.map(resolveSystem(dXViews), function(view) {
                return 'views/'+view;
            });

            require(viewPaths, function() {
                res = Array.prototype.slice.call(arguments, 0);

                for(i in res) {
                    if (!res.hasOwnProperty(i)) { continue; }
                    viewNames.push(res[i].prototype.dXName);
                    if (!res[i].prototype.dXName) { continue; }
                    views[res[i].prototype.dXName] = res[i];
                    res[i].prototype.dXViewList = views;
                }

                markViews(viewNames, views, viewPaths);

                log.yellow('registered views:\n     '+viewPaths.join(',\n     '));
                load(views);
            });
        }
    };
});