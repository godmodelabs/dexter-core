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
     * dXItem is the representation of a collection entry in
     * the dom. This and every extended view can be referenced
     * to any collections view attribute and will be created
     * if items are added to the collection.
     *
     * @class dXItem
     * @extends dXView
     * @author Riplexus <riplexus@gmail.com>
     */

    var dXItem = dXView.extend(/** @lends dXItem.prototype */{

        /**
         * Mark this view as item.
         */

        dXType: 'item',

        /**
         * We have to build the template here, to work properly
         * with epoxy. The template is already loaded and can be
         * required synchronously.
         *
         * @augments dXView
         * @returns {string}
         */

        el: function() {
            if (!this.dXName) {
                debug.error(
                    'Missing dXName for item view!',
                    'Attribute dXName is required for every dXView');
                return;
            }

            if (!this.dXViewList) {
                debug.error(
                    'Item view not loaded via dXViewLoader!',
                    'Add the path of '+this.dXName+' under views in /configs/dX.json');
                return;
            }

            if (_.indexOf(Object.keys(this.dXViewList), this.dXName) === -1) {
                debug.error(
                    'Missing view declaration for item #'+this.dXName+'!',
                    'Add \''+this.dXName+'\' under views in configs/dX.json');
                return 'asd';
            }

            var template = this.dXTemplateRenderer(require('text!templates/'+this.dXPath+'.html'),
                typeof this.dXTemplateData === 'function'?
                    this.dXTemplateData(this) : this.dXTemplateData);

            // Todo Strange jQuery bug, investigate
            while (template[0] === '\r' ||
                template[0] === '\n' ||
                template[0] === '\t' ||
                template[0] === ' ') {
                template = template.substr(1, template.length-1);
            }

            return template;
        },

        /**
         * The template has to be available at the {@link dXItem#el}
         * call to support the data binding through epoxy. Thus we
         * have to override {@link dXView#dXEnter} to prevent the
         * html to be replaced.
         * We still need to set the $el id, load any subviews with
         * {@link dXView#dXGetSubViews} and call the enter functions
         * via {@link dXView#dXCallEnter}.
         *
         * @augments dXView
         */

        dXEnter: function() {
            this.$el.attr('id', this.dXId);
            this.dXGetSubViews();
            this.dXCallEnter();
        },

        /**
         * Override {@link dXView#dXCallEnter} to suppress debugging
         * output for every item added.
         *
         * @augments dXView
         */

        dXCallEnter: function dXCallEnter() {
            applyMaybe(this, 'enter');
        }
    });

    return dXItem;
});