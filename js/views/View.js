define([
    'underscore',
    'jquery',
    'backbone',
    'epoxy',
    'dX/libs/debug',
    'dX/libs/uuid',
    'dX/libs/pipe',
    'dX/libs/applyMaybe',
    'dX/Shim!Function.prototype.bind',
    'dX/Shim!Object.keys'
], function(
    _, $,
    Backbone,
    epoxy,
    debug,
    uuid,
    pipe,
    applyMaybe
) {

    debug = debug('DX');

    /**
     * This is the basic view of the dexter framework. It
     * defined the required attributes and methods, prefixed
     * with dX. dXView supports subViews, loading element
     * injection, unique identifiers, enter and leave methods,
     * automatic template loading and html caching.
     *
     * @class dXView
     * @author Riplexus <riplexus@gmail.com>
     * @example
     * dXView.extend({
     *   dXName: 'myView',
     *
     *   initialize: function() {},
     *   enter: function() {},
     *   leave: function() {}
     * });
     */

    var dXView = Backbone.Epoxy.View.extend(/** @lends dXView.prototype */{

        /**
         * Generate a unique id for this view and call
         * {@link dXView#dXEnter} afterwards to insert the
         * template.
         */

        initialize: function initialize() {
            this.$parent = this.$el.parent();
            this.dXDomIndex = this.$parent.children().index(this.$el);
            this.dXId = 'dX-' + uuid();
            this.dXConnect();
            this.dXEnter();
        },

        /**
         * This method will be called by Backbone. It returns
         * a css selector for the desired location of the
         * template. Dexter uses elements with data-dX attributes.
         * To reduce the DOM lookup time, use the scope (of a
         * potential parent element) if available.
         *
         * @returns {string}
         */

        el: function el() {
            return this.dXScope += ' [data-dX='+this.dXName+'-'+this.dXIndex+']';
        },

        /**
         *
         */

        $el: null,

        /**
         *
         */

        $parent: null,

        /**
         *
         */

        dXDomIndex: 0,

        /**
         * The id of this view. A uuid will be generated on
         * initialization and assigned. The element containing
         * this views template in the DOM will have his id set
         * to this value.
         */

        dXId: null,

        /**
         *
         */

        dXIndex: 0,

        /**
         *
         */

        dXName: null,

        /**
         * A CSS selector to reduce DOM lookup time on initializing
         * this view. Useful if this is used as a subView.
         */

        dXScope: '',

        /**
         * If the view is not needed (e.g. because the user
         * navigates away), the template will be detached and
         * cached here for further reuse.
         */

        dXCache: null,

        /**
         * The real, relative path to this view. It can be system
         * specific (e.g. android/view) and will be set by the
         * view loader.
         * Used by the template loader to get the views template.
         *
         * @type {string}
         */

        dXPath: null,

        /**
         * The viewLoader adds a reference to the view prototypes
         * here, so that the view can instantiate any subviews.
         *
         * @type {Object}
         */

        dXViewList: null,

        /**
         * This array contains a list of the required subviews for
         * this view. They will be loaded and managed without
         * further developer input.
         * Overwrite this array to register subviews.
         * It can contain any system specific declarations
         * (e.g. 'android!view').
         *
         * @type {Array.<dXView>}
         */

        dXSubViews: [],

        /**
         * The subview cache contains the instances of the subviews.
         * They are always extending dXView. The keys are the
         * subview dXNames.
         *
         * @type {Object}
         */

        dXSubViewCache: {},

        /**
         * This object contains the behaviour configuration of a
         * dXView mostly in form of flags.
         * The injection of the loading screen can be disabled,
         * if not needed. If your view uses asynchronous rendering,
         * set clearLoading to false and call {@link dXView#dXClearLoading}
         * manually. If you want to leave the view present after
         * leaving, set the flag here. The template name can be
         * overwritten too (defaults to the provided dXName).
         *
         * @type {Object}
         */

        dXConfig: {
            setLoading: true,
            clearLoading: true,
            templateName: null
        },

        /**
         * A reference to the application dXRouter. Will be set by the
         * router himself.
         *
         * @type {dXRouter}
         */

        dXRouter: null,

        /**
         * Any view can assign a html snippet to this attribute. It will
         * then be inserted until every enter event is finished and every
         * subview is loaded. Can be enabled/disabled with dXConfig.setLoading,
         * dXConfig.clearLoading.
         *
         * @type {?string}
         */

        dXLoading: null,

        /**
         * Tries to return every subview mentioned in {@link dXView#dXSubViews}.
         * If a view is not yet cached, create a new instance and
         * add this scope.
         *
         * @returns {object} Returns the {@link dXView#dXSubViewCache}.
         */

        dXGetSubViews: function dXGetSubViews() {
            var i, subView, SubView, subViews, subViewName, $view,
                that = this;

            subViews = {};
            for (i=this.dXSubViews.length; i--;) {
                subViewName = this.dXSubViews[i].replace(/[^\/!]+!/g, '');
                subView = [];

                if (subViewName in this.dXSubViewCache) {
                    subView = this.dXSubViewCache[subViewName];
                    _.each(subView, function(view) {
                        if ('dXEnter' in view) {
                            view.dXEnter();
                        }
                    });

                } else if (subViewName in this.dXViewList) {

                    SubView = this.dXViewList[subViewName];
                    $view = this.$el.find('[data-dX='+subViewName+']');

                    if ($view.length === 0) {
                        debug.error(
                            'Missing container for subview #'+subViewName+'!',
                            'Create at least one with data-dX='+subViewName+' in '+this.dXPath+'.html');
                        continue;
                    }

                    $view.each(function(index) {
                        var $this = $(this);
                        $this.attr('data-dX', subViewName+'-'+index);

                        SubView = SubView.extend({
                            dXScope: '#'+that.dXId,
                            dXRouter: that.dXRouter,
                            dXIndex: index
                        });
                        subView.push(new SubView());
                    });

                } else {
                    debug.error(
                        'Unknown subview #'+subViewName+'!',
                        'Create a view and declare it under views in configs/dX.json');
                }

                subViews[subViewName] = subView;
            }

            return this.dXSubViewCache = subViews;
        },


        /**
         * Tries to return every subview mentioned in {@link dXView#dXSubViews}.
         * If a view is not yet cached, create a new instance and
         * add this scope.
         */

        dXGetSnippets: function dXGetSnippets() {
            var $targets = this.$el.find('[data-dX-snippet]');
            if ($targets.length === 0) { return; }
            var targets = [];

            $targets.each(function() {
                targets.push('text!snippets/'+$(this).attr('data-dX-snippet')+'.html');
            });

            for (var i=0, l=targets.length, data, attr, attrList; i<l; i++) {
                data = {};
                attrList = $targets.get(i).attributes;
                for (attr in attrList) {
                    if (!attrList.hasOwnProperty(attr)) { continue; }
                    if (!attrList[attr].name || attrList[attr].name.substr(0,11) !== 'data-dx-var') { continue; }
                    data[attrList[attr].name.substr(12)] = attrList[attr].value;
                }
                $targets.eq(i).replaceWith(this.dXTemplateRenderer(require(targets[i]), data));
            }
        },

        /**
         * This is one of the main methods of a dXView. It will be
         * called on initializing and further entering.
         * The template will be required synchronously (preloaded
         * with the dXTemplateLoader plugin), any static template data
         * will be rendered from {@link dXView#dXTemplateData} and
         * inserted with {@link dXView#dXInsert}. The loading screen
         * will be injected and removed if configured and the subviews
         * will be called via {@link dXView#dXGetSubViews}.
         *
         * @param {boolean} [propagate] If false, don't render the subviews.
         */

        dXEnter: function dXEnter(propagate) {
            debug.lightgreen('prepare #'+this.dXName+' ['+(this.dXRouter.parameters||'')+']');

            var template, templateName;

            /*
             * Prepend loading screen, if configured. The template
             * is preloaded.
             */

            if (this.dXConfig.setLoading) {
                this.dXSetLoading();
            }

            /*
             * Insert view template. We can use synchronous require
             * here, because the templates are already loaded by the
             * dXTemplateLoader plugin. Use cached nodes if available.
             */

            if (!this.dXCache) {
                templateName = this.dXConfig.templateName || this.dXPath;
                template = require('text!templates/'+templateName+'.html');

                try {
                    template = this.dXTemplateRenderer(template,
                        typeof this.dXTemplateData === 'function' ?
                            this.dXTemplateData(this) : this.dXTemplateData);

                } catch(err) {
                    debug.palevioletred('stopped #'+this.dXName+': '+err);
                    return;
                }

            } else {
                debug.lightgray('get cached template for #'+this.dXName);
                template = this.dXCache;
            }

            /*
             * Empty container and insert template. Set unique id for
             * further dom access.
             */

            this.dXInsert(template);

            /*
             * Reinsert loading screen after emptying the container.
             */

            if (this.dXConfig.setLoading) {
                this.dXSetLoading();
            }

            /*
             * Load subviews.
             */

            if (propagate !== false) {
                this.dXGetSnippets();
                this.dXGetSubViews();
            }

            /*
             * Remove loading screen if configured.
             */

            if (this.dXConfig.clearLoading) {
                this.dXClearLoading();
            }

            // Call enter functions
            setTimeout(function() {
                this.dXCallEnter();
            }.bind(this), 0);
        },

        /**
         * Insert the template into the DOM. This is detached, so you
         * can override it, if you want to insert the template into a
         * special, case-sensitive container.
         *
         * @param {string|HTMLElement} template
         */

        dXInsert: function dXInsert(template) {
            this.$el
                .empty()
                .append(template)
                .attr('id', this.dXId)
                .addClass(this.dXName)
                .removeAttr('data-dX');

            var $children = this.$parent.children();
            $children.eq($children.length-1 < this.dXDomIndex? $children.length-1 : this.dXDomIndex)
                .after(this.$el);
        },

        /**
         * This will be called, if the view is not longer needed. It
         * tells the subviews to leave and detaches the template.
         *
         * @param {boolean} propagate If false, don't leave the subviews.
         */

        dXLeave: function dXLeave(propagate) {
            debug.palevioletred('leave #'+this.dXName);

            this.dXCallLeave();

            /*
             * Tell subviews to leave.
             */

            if (propagate !== false &&
                Object.keys(this.dXSubViewCache).length > 0) {

                _.each(this.dXSubViewCache, function(views) {
                    _.each(views, function(view) {
                        if ('dXLeave' in view) {
                            view.dXLeave();
                        }
                    });
                });
            }

            /*
             * Cache template, save current index (can change during runtime!)
             * and detach $el.
             */

            this.dXCache = this.$el.contents().detach();
            this.$el.removeClass(this.dXName);
            this.$el.attr('data-dX', this.dXName+'-'+this.dXIndex);
            this.dXDomIndex = this.$parent.children().index(this.$el);
            this.$el.detach();
        },

        /**
         * This will be called in {@link dXView#dXEnter}. It
         * calls the views enter function, if defined.
         */

        dXCallEnter: function dXCallEnter() {
            debug.green('enter #'+this.dXName);
            applyMaybe(this, 'enter');
            this.dXPipe.emit('enter/'+this.dXName);

        },

        /**
         * This will be called in {@link dXView#dXLeave}. It
         * calls the views leave function, if defined.
         */

        dXCallLeave: function dXCallLeave() {
            applyMaybe(this, 'leave');
            this.dXPipe.emit('leave/'+this.dXName);
        },

        /**
         * Prepend the loading screen. The template
         * is already preloaded.
         * To support absolute positioned loading elements,
         * save the current position attribute and replace
         * 'static' with 'relative' until the loading
         * screen is removed.
         */

        dXSetLoading: function dXSetLoading() {
            if (this.$el.css('position') === 'static') {
                this.$el.css('position', 'relative');
                this.$el.dXCssPositionStatic = true;
            }

            if (this.dXLoading) {
                this.$el.prepend($('<div></div>')
                    .addClass('loading')
                    .html(this.dXLoading));
            }
        },

        /**
         * Remove the loading screen for this view.
         * Restore the previously saved position attribute.
         */

        dXClearLoading: function dXClearLoading() {
            if (this.$el.dXCssPositionStatic) {
                this.$el.css('position', '');
                delete this.$el.dXCssPositionStatic;
            }

            this.$el.children('.loading').remove();
        },

        /**
         * This method can be overridden to provide static
         * data for the template. It can be an object or a
         * function returning an object.
         *
         * @param {object} item
         */

        dXTemplateData: function(item) {},

        /**
         * Overwrite this method with the template renderer of
         * your choice. For an example of the use of mustache,
         * look at the example branch.
         *
         * @param {string} template
         * @param {object} data
         * @returns string
         */

        dXTemplateRenderer: function(template, data) {
            return template;
        },

        /**
         * To communicate between views, distant collections
         * and models, dexter uses an event emitter as a 'Pipe
         * Network'. It can be (dis)connected with
         * {@link dXView#dXDisconnect} and {@link dXView#dXConnect}.
         */

        dXPipe: null,

        /**
         * Disconnect from the dXPipe Network. If disconnected,
         * events can still be bound, but will only be called
         * when reconnected.
         */

        dXDisconnect: function dXDisconnect() {
            this.dXPipe.isOffline = true;
        },

        /**
         * (Re)connect to the dXPipe event emitter network.
         */

        dXConnect: function dXConnect() {
            var self = this;

            if (self.dXPipe) {
                self.dXPipe.isOffline = false;
                return;
            }

            self.dXPipe = {
                isOffline: false,

                emit: function() {
                    if (!self.dXPipe.isOffline) {
                        pipe.emit.apply(self, arguments);
                    }
                },

                on: function(event, fn) {
                    (function(fn) {
                        pipe.on(event, function() {
                            if (!self.dXPipe.isOffline) {
                                fn.apply(self, arguments);
                            }
                        });
                    })(fn);
                }
            };
        }
    });

    return dXView;
});