define([
    'underscore',
    'jquery',
    'backbone',
    'dX/libs/debug',
    'dX/libs/applyMaybe',
    'dX/View'
], function(
    _, $,
    Backbone,
    debug,
    applyMaybe,
    dXView
) {

    debug = debug('DX');

    /**
     *
     * @class StaticView
     * @extends dXView
     * @author Riplexus <riplexus@gmail.com>
     * @example
     * StaticView.extend({
     *   dXName: 'myStaticView'
     * });
     */

    var dXStaticView = dXView.extend(/** @lends dXStaticView.prototype */{

        /**
         * Mark this views as static.
         */

        dXType: 'static'
    });

    return dXStaticView;
});