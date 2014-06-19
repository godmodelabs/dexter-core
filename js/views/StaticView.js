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
     * @author Riplexus <riplexus@gmail.com>
     * @example
     * StaticView.extend({
     *   dXName: 'myStaticView'
     * });
     */

    var dXStaticView = dXView.extend(/** @lends dXStaticView.prototype */{

        /**
         *
         * @augments dXView
         * @constructs dXStaticView object
         */

        initialize: function() {
            dXView.prototype.initialize.call(this);
        }
    });

    return dXStaticView;
});