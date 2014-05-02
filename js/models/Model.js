define([
    'underscore',
    'jquery',
    'backbone',
    'dX/libs/debug',
    'dX/libs/pipe'
], function(
    _, $,
    Backbone,
    debug,
    pipe
) {

    /**
     * This basic model in the dexter framework
     * is used to connect the model to the pipe
     * event emitter network for further communication
     * between distant views, models and collections.
     * It provides the necessary (dis)connect methods
     * and initializes the pipe connection on
     * {@link dXModel#initialize}.
     *
     * @class dXModel
     * @author Riplexus <riplexus@gmail.com>
     */

    var dXModel = Backbone.Model.extend(/** @lends dXModel.prototype */{

        /**
         * Connect with the dXPipe network on initializing.
         */

        initialize: function() {
            this.dXConnect();
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

    return dXModel;
});