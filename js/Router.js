/**
 * The router manages the loading of static and routed
 * views and the behaviour on route change. We use the
 * Backbone.Router to simplify the routing.
 *
 * @class Router
 * @author: Riplexus <riplexus@gmail.com>
 */

define([
    'underscore',
    'jquery',
    'backbone',
    'modernizr',
    'configs/dXRoutes.conf',
    'configs/dXViews.conf',
    'dX/ViewLoader!',
    'dX/TemplateLoader!',
    'dX/libs/debug',
    'dX/libs/pipe',
    'dX/libs/flip',
    'dX/libs/removeClasses',
    'dX/Shim!Object.keys'
], function(
    _, $,
    Backbone,
    Modernizr,
    routesConf,
    dXViews,
    viewList,
    templateList,
    debug,
    pipe,
    flip,
    removeClasses
) {

    debug = debug('DX');

    var $body = $('body'),
        viewRoutes = flip(routesConf),
        staticViews = _.difference(_.keys(viewList), _.keys(viewRoutes)),
        errCheck = _.difference(_.keys(viewRoutes), _.keys(viewList));

    if (errCheck.length) {
        debug.error(
            'Missing view declaration for routed #'+errCheck.join(', #')+'!',
            'Add \''+errCheck.join()+'\' in /configs/dXViews.conf.js');
    }

    return new (Backbone.Router.extend(/** @lends Router.prototype */{

        routes: routesConf,

        /**
         * Stores the current, route-linked view.
         */

        currentView: {},

        /**
         * Stores the routed views, if loaded.
         */

        viewCache: {},

        /**
         * An object with every view prototype.
         */

        viewList: viewList,

        /**
         * Maps the view names to routes.
         */

        viewRoutes: viewRoutes,

        /**
         * Cached route classes, will be added to the body.
         */

        routeClasses: {},

        /**
         * The current routing parameters.
         */

        parameters: [],

        /**
         * The main behaviour of the router is described here.
         * Load static views first, register the routed views
         * afterwards and manage the behaviour on route change.
         */

        start: function() {
            var i, view, viewName, $view,
                that = this;

            /*
             * Load static views.
             */

            for (i=staticViews.length; i--;) {
                viewName = staticViews[i];

                if (!(viewName in this.viewList)) {
                    continue;
                }
                if (this.viewList[viewName].prototype.dXType === 'item') {
                    continue;
                }
                if (this.viewList[viewName].prototype.dXType !== 'static') {
                    debug.error(
                        'View #'+viewName+' not static and not routed!',
                        'Either extend dX/StaticView or declare in configs/dXRoutes.conf.js');
                    continue;
                }

                view = [];
                $view = $body.find('[data-dX='+viewName+']');

                if (!$view.length) {
                    debug.error(
                        'Missing container for static #'+viewName+'!',
                        'Create one with data-dX='+viewName+' in your index.html');
                }

                $view.each(function(index) {
                    var $this = $(this);
                    $this.attr('data-dX', viewName+'-'+index);

                    view = new (that.viewList[viewName].extend({
                        dXRouter: that,
                        dXIndex: index
                    }))();
                });

                this.viewCache[viewName] = view;
            }

            /*
             * Match the route to his corresponding view and
             * render it dynamically.
             */

            for (viewName in this.viewList) {
                if (!this.viewList.hasOwnProperty(viewName)) { continue; }

                (function(viewName) {

                    /*
                     * Manage route changes.
                     */

                    this.on('route:'+viewName, function() {
                        var path, that = this;

                        /*
                         * Store the route parameters in <dXRouter.parameters> for the
                         * views.
                         */

                        if (arguments[0] !== null) {
                            this.parameters = Array.prototype.slice.call(arguments);
                        }
                        this.path = Backbone.history.fragment;

                        debug.lightblue('navigate to /'+this.path);

                        /*
                         * Create a list of route classes for the current view, will
                         * be assigned to the body for any route specific css code.
                         */

                        if (!(viewName in this.routeClasses)) {
                            path = this.viewRoutes[viewName][0];
                            this.routeClasses[viewName] = [];

                            path = path.replace(/(\*path|:)/g, '').split('/');
                            while(path.length) {
                                this.routeClasses[viewName]
                                    .push('route-'+(path.join('-') || 'index'));
                                path.pop();
                            }
                        }
                        removeClasses($body[0], 'route-');
                        $body.addClass(this.routeClasses[viewName].join(' '));

                        /*
                         * Leave current view.
                         */

                        _.each(this.currentView, function(view) {
                            if ('dXLeave' in view) {
                                view.dXLeave();
                            }
                        });

                        /*
                         * Get or create the desired view instance and render
                         * it with his subviews with <dXEnter>. If the view is
                         * not yet cached, the initialization will call <dXEnter>.
                         */

                        if (!(viewName in this.viewCache)) {
                            view = [];
                            $view = $body.find('[data-dX='+viewName+']');

                            if (!$view.length) {
                                debug.error(
                                    'Missing container for #'+viewName+'!',
                                    'Create one with data-dX='+viewName+' in your index.html');
                                return;
                            }

                            $view.each(function(index) {
                                var $this = $(this);
                                $this.attr('data-dX', viewName+'-'+index);

                                view.push(new (that.viewList[viewName].extend({
                                    dXRouter: that,
                                    dXIndex: index
                                }))());
                            });
                            that.viewCache[viewName] = view;

                        } else {
                            view = this.viewCache[viewName];
                            _.each(view, function(item) {
                                if ('dXEnter' in item) {
                                    item.dXEnter();
                                }
                            });
                        }

                        // Reference current router-enabled view
                        this.currentView = view;
                    }.bind(this));

                }.bind(this))(viewName);
            }

            /*
             * Start backbone navigation.
             */

            if (Modernizr.history) {
                Backbone.history.start({ pushState: true });
            } else {
                Backbone.history.start();
            }

            /*
             * Prevent page reload on link click.
             */

            $(document).on('click', 'a[href^="/"]', function(event) {
                var href, url;

                href = $(event.currentTarget).attr('href');
                if (!event.altKey && !event.ctrlKey &&
                    !event.metaKey && !event.shiftKey) {

                    event.preventDefault();
                    url = href.replace(/^\//,'').replace(/#!/, '');
                    this.navigate(url, { trigger: true });
                }
            }.bind(this));

            /*
             * Router events.
             */

            pipe.on('dXRouter/goTo', this.goTo.bind(this));
        },

        /**
         * Convenience navigation method.
         *
         * @param {string} path
         */

        goTo: function(path) {
            this.navigate(path, {trigger: true});
        }
    }))();

});