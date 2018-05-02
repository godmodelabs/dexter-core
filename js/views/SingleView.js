define([
    'underscore',
    'jquery',
    'backbone',
    'dX/libs/debug',
    'dX/libs/uuid',
    'dX/libs/applyMaybe',
    'dX/View'
], function(
    _, $,
    Backbone,
    debug,
    uuid,
    applyMaybe,
    dXView
) {

    debug = debug('DX');

    /**
     *
     *
     * @class dXSingleView
     * @extends dXView
     * @author Riplexus <riplexus@gmail.com>
     */

    var dXSingleView = dXView.extend(/** @lends dXSingleView.prototype */{

        /**
         */

        dXType: 'single'
    });

    return dXSingleView;
});