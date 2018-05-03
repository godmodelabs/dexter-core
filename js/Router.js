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
    'json!configs/dX.json',
    'dX/ViewLoader!',
    'dX/TemplateLoader!',
    'dX/SnippetLoader!',
    'dX/libs/debug',
    'dX/libs/pipe',
    'dX/libs/flip',
    'dX/libs/removeClasses',
    'dX/Shim!Object.keys'
], function(
    _, $,
    Backbone,
    Modernizr,
    config,
    viewList,
    templateList,
    snippetList,
    debug,
    pipe,
    flip,
    removeClasses
) {

    debug = debug('DX');

    var $body = $('body'),
        viewRoutes = flip(config.routes),
        staticViews = _.difference(_.keys(viewList), _.keys(viewRoutes)),
        errCheck = _.difference(_.keys(viewRoutes), _.keys(viewList));

    if (errCheck.length) {
        debug.error(
            'Missing view declaration for routed #'+errCheck.join(', #')+'!',
            'Add \''+errCheck.join()+'\' under views in /configs/dX.json');
    }

    return new (Backbone.Router.extend(/** @lends Router.prototype */{

        routes: config.routes,

        /**
         * Stores the current, route-linked view.
         */

        currentView: [],

        /**
         *
         */

        currentRoute: null,

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
         * Find and return current route by history.fragment.
         *
         * @returns {string}
         */

        getRoute: function() {
            this.path = decodeURIComponent(window.location.pathname.substr(1));

            if (this.path === '') {
                this.currentRoute = 'index';
                return this.currentRoute;
            }
            for (var viewName in this.viewRoutes) {
                if (!this.viewRoutes.hasOwnProperty(viewName)) { continue; }
                for (var i=0, l=this.viewRoutes[viewName].length, exp; i < l; i++) {
                    if (this.viewRoutes[viewName][i] === '*path') { continue; }
                    exp = new RegExp('^' + this.viewRoutes[viewName][i].replace(/:\w+/g, '[\\w\\s]+') + '$');
                    if (exp.exec(this.path)) {
                        this.currentRoute = this.viewRoutes[viewName][i];
                        return this.currentRoute;
                    }
                }
            }
        },

        /**
         * The main behaviour of the router is described here.
         * Load static views first, register the routed views
         * afterwards and manage the behaviour on route change.
         */

        start: function() {
            var i, view, viewName, $view,
                that = this;

            this.getRoute();

            /*
             * Load static views.
             */

            for (i=staticViews.length; i--;) {
                viewName = staticViews[i];

                if (!(viewName in this.viewList)) {
                    continue;
                }

                // ignore abstract views
                if (!this.viewList[viewName].prototype.dXName) {
                    continue;
                }

                if (this.viewList[viewName].prototype.dXType === 'item' ||
                    this.viewList[viewName].prototype.dXType === 'subview') {
                    continue;
                }

                if (this.viewList[viewName].prototype.dXType === 'single') {
                    this.viewList[viewName].prototype.dXRouter = this;
                    continue;
                }

                if (this.viewList[viewName].prototype.dXType !== 'static') {
                    debug.error(
                        'View #'+viewName+' not subview, static or routed!',
                        'Either mention it as a SubView, extend dX/StaticView or declare it under routes in configs/dX.json');
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
                        var that = this, i, l, prev;

                        this.getRoute();

                        /*
                         * Store the route parameters in <dXRouter.parameters> for the
                         * views.
                         */

                        if (arguments[0] !== null) {
                            this.parameters = Array.prototype.slice.call(arguments);
                        }

                        $body.removeClass("dX-loadingFinished");

                        this.preNavigation(function() {
                            debug.lightblue('navigate to /'+this.path);

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

                            // emit navigation event with previous and entering view
                            pipe.emit('navigation', this.path, this.currentView, view);
                            pipe.emit('navigation/'+this.path, this.currentView, view);

                            // Reference current router-enabled view
                            this.currentView = view;

                            /*
                             * Create a list of route classes for the current view, will
                             * be assigned to the body for any route specific css code.
                             */

                            this.routeClasses = this.currentRoute.replace(':', '').split('/');
                            for (i=0, l=this.routeClasses.length, prev='dXRoute'; i<l; i++) {
                                prev += '-'+this.routeClasses[i];
                                this.routeClasses[i] = prev;
                            }
                            removeClasses($body[0], 'dXRoute-');
                            $body.addClass(this.routeClasses.join(' '));
                            this.postNavigation(function() {
                                $body.addClass('dX-loadingFinished');
                            });

                        }.bind(this));
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
            pipe.on('dXRouter/get', function(cb) { cb(this); }.bind(this));
        },

        /**
         *
         * @param fn
         */

        preNavigation: function(fn) {
            setTimeout(fn, 0);
        },

        /**
         *
         * @param fn
         */

        postNavigation: function(fn) {
            setTimeout(fn, 0);
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