/**
 * Get every view mentioned in dXViews.conf.js.
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

    var log = debug('DX'),
        paths = [];

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
     * Get the necessary view objects via require.js. Look for any
     * subviews and get them recursively.
     * Manage the real paths for the views by setting the dXPath
     * and dXSubViewPaths values to the view prototypes (move this
     * to another location maybe?)
     *
     * @param require
     * @param list
     * @param ret
     * @param callback
     * @ignore
     */

    function getViewList(require, list, ret, callback) {
        var views, i, j, view, subViews, subViewList, viewList, path, key;

        viewList = [];

        require(list, function() {
            views = Array.prototype.slice.call(arguments, 0);

            for (i=views.length; i--;) {
                view = views[i];
                subViewList = [];

                // Views without dXName are not working
                if (!view.prototype.dXName) { continue; }

                // Tell the view his real path
                view.prototype.dXPath = list[i].replace('views/', '');

                // Reference the path for logging
                paths.push(view.prototype.dXPath);

                // Each view has to know the path of his subViews
                view.prototype.dXSubViewPaths = {};

                // Tell subview his type
                view.prototype.dXType = 'subview';

                subViews = view.prototype.dXSubViews;
                if (subViews) {
                    for (j=subViews.length; j--;) {
                        // Check system declarations
                        path = checkSystem(subViews[j]);

                        // dXName of the subview
                        key = subViews[j].substr(subViews[j].search('!')+1);

                        // The first, most specific path has priority if already defined
                        if (!(key in view.prototype.dXSubViewPaths &&
                            view.prototype.dXSubViewPaths[key].split('/').length >= path.split('/').length)) {
                            // Save the subView path, (dXName => path)
                            view.prototype.dXSubViewPaths[key] = path;
                        }
                        // Save the path to fetch the subView object
                        subViewList.push('views/'+path);
                    }
                }

                // Remove duplicate subViews (e.g. from system declarations)
                subViewList = specialUnique(subViewList);

                // Add the subViews of this view to the list for requiring
                viewList = viewList.concat(subViewList);

                // Save this view object for returning
                ret[view.prototype.dXName] = view;
            }

            // If there are any subViews who need to be fetched, do it
            if (viewList.length === 0) {
                callback(ret);
            } else {
                getViewList(require, viewList, ret, callback);
            }

        });
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
        if (name.match(/[^!]+![^!]+/)) {
            name = name.split('!');
            if (is.hasOwnProperty(name[0]) &&
                is[name[0]]()) {
                name = name.join('/');

            } else {
                name = name[1];
            }
        }

        return name;
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
            if (config.isBuild) { return load(); }

            var viewPaths, ret;

            viewPaths = [];
            ret = {};

            // Collect every view path, needed for rendering
            // Resolve system specific declarations.

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

            // Retrieve the views recursively.

            getViewList(require, viewPaths, ret, function(ret) {
                log.yellow('registered views:\n     '+paths.join(',\n     '));
                load(ret);
            });
        }
    };
});