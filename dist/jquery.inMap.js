/**
 * @fileOverview This defines the jQuery plugin `inMap` which returns an instance of the
 * InMap class - simplified wrapper for the Mapbox API specifically for the
 * needs of Internations.
 *
 * @example
 * // the most basic usage
 * var map_id = 'examples.map-i86nkdio';
 * var map = $('#map').inMap(map_id);
 *
 * map.addMarker([12, 34]);
 */
define(['jquery', 'underscore', 'mapbox', 'leaflet.markercluster'], function ($, _, mb, mc) {
    'use strict';
    if (!Function.prototype.bind) {
        Function.prototype.bind = function (oThis) {
            if (typeof this !== "function") {
                // closest thing possible to the ECMAScript 5
                // internal IsCallable function
                throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
            }

            var aArgs = Array.prototype.slice.call(arguments, 1),
            fToBind = this,
            FNOP = function () {},
            fBound = function () {
                return fToBind.apply(this instanceof FNOP && oThis ? this : oThis, aArgs.concat(Array.prototype.slice.call(arguments)));
            };

            FNOP.prototype = this.prototype;
            fBound.prototype = new FNOP();

            return fBound;
        };
    }

    var VERSION = '1.5.0';

    if (window.L) {
        var L = window.L;
    } else {
        window.alert('Mapbox/Leaflet has not been loaded');
    }
    var ie = (function(){
        var undef, v = 3, div = document.createElement('div'), all = div.getElementsByTagName('i');
        while ( div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->', all[0]);
        return v > 4 ? v : undef;
    }());
    /**
     * @name InMap
     * @constructor
     * @param id {String} id of the DOM element
     * @param mapbox_id {String} id of the mapbox map (eg example.123abc45)
     * @param options {Object} if options.position is an object, it's assuming
     * that it's a marker and passed to addMarker
     * @param options {Array} if options is an array, it's assuming that
     * it's an array of markers.
     */
    function InMap(id, mapbox_id, options) {
        options             = options || {};
        this.id = id;
        this.map            = (typeof options.mapbox === 'object') ?  L.mapbox.map(id, mapbox_id, options.mapbox) : L.mapbox.map(id, mapbox_id) ;
        this.markers        = [];
        this.markerLayer    = undefined;
        this.countryLayers  = {};
        this.countryGroup = L.featureGroup();
        this.highlightGroup = L.featureGroup();
        this.goalGroup = L.featureGroup();

        this.styles = {
            base: {
                fillColor: "#cae6bd",
                fillOpacity: 0.25,
                opacity: 1,
                color: "#203047",
                weight: 2
            },

            hover: {
                fillOpacity: 0.5,
                color: "#203047",
                weight: 2
            },

            goal: {
                fillOpacity: 0.5,
                fillColor: "#aaaaaa",
                color: "#aaaaaa",
                weight: 2
            },

            goalHover: {
                fillColor: "#cae6bd",
                fillOpacity: 0.25,
                opacity: 1,
                color: "#203047",
                weight: 2
            }
        };

        this.options = {};
        this.options.panDuration = 0.25;
        this.options.paddingTopLeft = [0, 0];
        this.options.zoomLevel = 5;
        this.options.mouseScroll = true;
        this.options.markerClusteringEnabled = false;
        this.options.markerClusteringOptions = {};

        this.__events = {
            zoomnext: [],
            zoomprev: [],
            hoverstart: [],
            hoverend: []
        };

        if (_.isObject(options.popupOptions)) {
            L.Popup.mergeOptions(options.popupOptions);
        }

        if (_.isObject(options.markerClusteringOptions)) {
            this.options.markerClusteringOptions = options.markerClusteringOptions;
        }

        if (_.isArray(options.position)) {
            // when a position was given, we assume that it's a marker
            this.addMarker(options);
        } else if (typeof options == 'object') {
            this.options = _.extend(this.options, options);
        }

        if (_.isArray(options)) {
            this.addMarkers(options);
        }

        if (_.isArray(options.markers)) {
            this.addMarkers(options.markers);
        }

        if (this.options.mouseScroll === false) {
            this.map.scrollWheelZoom.disable();
        }

        this.countryGroup.on('dblclick', function (e) {
            this.map.setView(e.latlng, this.map.getZoom() +1);
        }.bind(this));
    }

    /**
     * @memberOf InMap
     * @param opts {Array|Object} either array with [lat,lng] position of marker or object with
     * properties
     * @param opts.title {String} title to be shown in infowindow
     * @param opts.description {String} description to be shown in infowindow
     * @param opts.descriptionSelector {String} selector containing the
     * description markup
     */
    InMap.parseMarker = function (opts) {
        var coords;
        var pos;
        if(opts instanceof Array) {
            coords = opts.reverse();
        }

        if(opts instanceof Object) {
            if(opts.position !== undefined) {
                pos = opts.position;
                coords = [ pos[1], pos[0] ];
            }
        }

        var args = {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: coords
            },
            properties: {}
        };

        if(opts.title !== undefined) {
            args.properties.title = opts.title;
        }

        if(opts.id !== undefined) {
            args.properties.id = opts.id;
        }

        if(opts.index !== undefined) {
            args.properties.index = opts.index;
        }

        if(opts.descriptionSelector !== undefined) {
            args.properties.description = $(opts.descriptionSelector).html();
        }

        if(opts.description !== undefined) {
            if(typeof opts.description === 'string') {
                args.properties.description = opts.description;
            }
        }

        if(opts.country !== undefined) {
            args.properties.country = opts.country;
        }

        if(opts.icon !== undefined) {
            if(typeof opts.icon === 'string') {
                args.properties.icon = {
                    iconUrl: opts.icon
                };
            }

            if(typeof opts.icon === 'object') {
                args.properties.icon = opts.icon;
            }
        }

        return args;
    };

    InMap.featureCount = function (featureLayer) {
        return featureLayer.getLayers().length;
    };

    /**
     * Add a single marker to the map.
     * @see InMap#parseMarker
     * @example
     * inMap.addMarker([12, 34]);
     *
     * @example
     * inMap.addMarker({
     *     position: [12, 34],
     *     title: 'Foo Bar',
     *     description: 'Some Description'
     * });
     *
     * @memberOf InMap
     */
    InMap.prototype.addMarker = function (opts) {
        this.addMarkers([opts]);

        return this;
    };

    /**
     * @memberOf InMap
     * @description Pipes the event handler through to leaflet's API
     * @see http://leafletjs.com/reference.html#map-events
     * @example
     * inmap.on('zoomend', function (e) {
     *  console.log("zooming finished);
     * });
     */
    InMap.prototype.on = function (event, callback) {
        if(this.__events[event]!== undefined) {
            this.__events[event].push(callback);
            return;
        }

        this.map.on(event, callback);
    };

    InMap.prototype.fire = function (event, args) {
        if(this.__events[event] !== undefined) {
            _.each(this.__events[event], function (fn) {
                fn(args);
            });

            return;
        }

        this.map.fire(event);
    };

    InMap.prototype.registerEvents = function (layer) {
        layer.on('click', function (e) {
            if(e.layer.feature.__events["marker:click"] !== undefined &&
                e.layer.feature.__events["marker:click"].length > 0) {
                _.each(e.layer.feature.__events["marker:click"], function (callback) {
                    callback(e.layer.feature, e);
                });
            }
        });

        layer.on('layeradd', function (e) {
            var marker = e.layer;
            var feature = marker.feature;
            if(feature && feature.properties.icon) {
                marker.setIcon(L.icon(feature.properties.icon));
            }
        });
    };

    InMap.prototype.getMarker = function (id) {
        var index = false;
        _.each(this.markers, function (marker, i) {
            if( marker.properties.id === id) {
                index = i;
            }
        });

        return index;
    };

    InMap.prototype.rebuildMapLayer = function () {
        this.markerLayer.setGeoJSON(this.markers);
    };

    InMap.prototype.removeMarker = function (index) {
        if(_.isString(index)) {
            index = this.getMarker(index);
        }

        this.markers.splice(index,1);
        this.rebuildMapLayer();
    };

    InMap.prototype.editMarker = function (index, marker) {
        this.markers[index] = InMap.parseMarker(marker);
        this.rebuildMapLayer();
    };

    InMap.prototype.zoomAll = function () {
        this.map.fitBounds(this.markerLayer.getBounds());
    };

    InMap.prototype.zoomCountries = function () {
        this.map.fitBounds(
            this.countryGroup.getBounds()
        );
    };

    InMap.prototype.zoomHighlighted = function () {
        this.map.fitBounds(
            this.highlightGroup.getBounds()
        );
    };

    InMap.prototype.enableMarkerClustering = function() {
        if (this.options.markerClusteringEnabled) {
            throw 'Cannot enable clustering after marker layer initialization.';
        }

        this.options.markerClusteringEnabled = true;
    };

    /**
     * @param markers {Array} an array of markers passed to addMarker
     * @memberOf InMap
     * @example
     * var markers = [{
     *     position: [12, 34],
     *     title: 'Foo Bar',
     *     description: 'Some Description'
     * }, {
     *     position: [56, 21],
     *     title: 'Foo Bar',
     *     description: 'Some Description'
     * }];
     * inMap.addMarkers(markers);
     */
    InMap.prototype.addMarkers = function (markers) {
        this._initializeMarkerLayer();

        var geojson = this.markerLayer.toGeoJSON();

        _.each(markers, function(data) {
            var marker = InMap.parseMarker(data);
            marker = this._attachMarkerEvents(marker);

            geojson.features.push(marker);

            if (data.country && this.countryData !== undefined) {
                this.highlightCountry(data.country);
            }

            this.markers.push(marker);
        }, this);

        this._addMarkersToMap(geojson);

        return this;
    };

    /**
     * Initialize marker cluster or feature layer as a marker layer.
     * @private
     */
    InMap.prototype._initializeMarkerLayer = function() {
        if (this.markerLayer !== undefined) {
            return;
        }

        this.markerLayer = this.options.markerClusteringEnabled
            ? new L.MarkerClusterGroup(this.options.markerClusteringOptions)
            : L.mapbox.featureLayer({ type: "FeatureCollection", features: [] });
        this.registerEvents(this.markerLayer);
        this.markerLayer.addTo(this.map);
    };

    InMap.prototype._attachMarkerEvents = function(marker) {
        marker.__events = {};
        marker.addEventListener = function (type, callback) {
            this.__events[type] = this.__events[type] || [];
            this.__events[type].push(callback);
        };

        return marker;
    };

    InMap.prototype._addMarkersToMap = function(geojson) {
        // MarkerClusterGroup has no setGeoJSON so let's bind popup and change icon manually
        if (this.options.markerClusteringEnabled) {
            var layer = L.geoJson(geojson);
            this.markerLayer.addLayers(layer.getLayers());

            return this.markerLayer.eachLayer(function(marker) {
                var props = marker.feature.properties;
                var popup = new L.Popup();

                popup.setContent(props.description);
                marker.setIcon(L.icon(props.icon));
                marker.bindPopup(popup, {
                    closeButton: false
                });
            });
        }

        this.markerLayer.setGeoJSON(geojson);
    };

    /**
     * @memberOf InMap
     * @example
     * inMap.setZoom([53.10, 8]);
     * @param position {Array} position in lat lng
     * @param options {Object} options passed to Leafletjs
     * @see http://leafletjs.com/reference.html#map-zoompanoptions
     */
    InMap.prototype.setZoom = function (pos, cb) {
        // TODO: extract into own method `calculatePositionWithOffset` or
        // similar
        var targetPoint = this.map.project(pos, this.map.zoomLevel)
            .subtract([
                this.options.paddingTopLeft[0],
                this.options.paddingTopLeft[1]
            ]);

        var targetLatLng = this.map.unproject(targetPoint, this.map.zoomLevel);

        if (this.map._initialCenter && this.map.getCenter().equals(targetLatLng)) {
            if (_.isFunction(cb)) {
                cb();
            }
            return;
        }

        this.map.setView(targetLatLng, this.map.zoomLevel, {
            zoom: {
                animate: this.options.zoomLevel === this.map.zoomLevel
            },

            pan: {
                duration: this.options.panDuration,
                animate: (!ie || ie > 9)
            }
        });
    };

    /**
     * Zoom to a specific marker that has been added before.
     * @memberOf InMap
     * @example
     * inmap.zoomAt(0);
     * @param index {Integer} the index of the marker to zoom at
     */
    InMap.prototype.zoomAt = function (index, callback, mapEvent) {
        var marker = this.getFeatureByIndex(index);

        if(callback && _.isFunction(callback)) {
            mapEvent = mapEvent || 'moveend';
            this.map.once(mapEvent, callback);
        }

        setTimeout(function() {
            this.openTooltip(marker);
        }.bind(this), 1);

        if (marker.properties.country !== undefined) {
            var latlng = this.countryLayers[marker.properties.country].getBounds();

            this.map.fitBounds(latlng, {
                paddingTopLeft: this.options.paddingTopLeft,
                pan: {
                    duration: this.options.panDuration,
                    animate: this.options.zoomLevel !== this.map.zoomLevel
                }
            });
        } else if (marker.geometry.coordinates) {
            var latlng = [
                marker.geometry.coordinates[1],
                marker.geometry.coordinates[0]
            ];

            this.setZoom(latlng, callback);
        }

        return this;
    };

    InMap.prototype.openTooltip = function(feature) {
        this.markerLayer.eachLayer(function(marker) {
            marker.closePopup();
            if (_.isEqual(feature.properties.index, marker.feature.properties.index)) {
                marker.openPopup();
            }
        });
    };

    InMap.prototype.getFeatureByIndex = function (index) {
        var layer = _.find(this.markerLayer.getLayers(), function(layer) {
            return layer.feature.properties.index == index;
        });

        return layer ? layer.feature : null;
    };

    /**
     * zoom to the next marker. Starting with 0.
     * @memberOf InMap
     * @example
     * inmap.zoomNext();
     */
    InMap.prototype.zoomNext = function (callback, mapEvent) {
        if (
            this.currentIndex === undefined ||
            this.currentIndex + 1 >= InMap.featureCount(this.markerLayer)
        ) {
            this.currentIndex = 0;
        } else {
            this.currentIndex++;
        }

        this.fire('zoomnext', this.markers[this.currentIndex]);
        this.zoomAt(this.currentIndex, callback, mapEvent);
    };

    /**
     * zoom to the previous marker. Starting with the last one
     * @memberOf InMap
     * @example
     * inmap.zoomPrev();
     */
    InMap.prototype.zoomPrev = function (callback, mapEvent) {
        if(this.currentIndex === undefined || this.currentIndex-1 < 0) {
            this.currentIndex = InMap.featureCount(this.markerLayer)-1;
        } else {
            this.currentIndex--;
        }

        this.fire('zoomprev', this.markers[this.currentIndex]);
        this.zoomAt(this.currentIndex, callback, mapEvent);
    };

    InMap.prototype.addCountryData = function (geoJson, cb) {
        var opts = {
            style: this.styles.base,
            className: 'inmap-country',
            onEachFeature: function (feature, layers) {
                this.registerCountryHandler(this)(feature, layers);
            }.bind(this)
        };
        var geoFeatures = this.geoFeatures;

        if(geoFeatures) {
            geoFeatures.push(geoJson.features);
        } else {
            geoFeatures = geoJson.features;
        }

        this.countryData = L.geoJson({
            "type": "FeatureCollection",
            "features": geoFeatures
        }, opts).addTo(this.map);
    };

    InMap.prototype.removeAllCountries = function (reset) {
        _.each(this.countryLayers, function (el, i) {
            this.removeCountryCode(i);
        }, this);

        this.geoFeatures = undefined;
        return this;
    };

    InMap.prototype.removeCountryCode = function (countryCode) {
        this.map.removeLayer(this.countryLayers[countryCode]);

        _.find(this.geoFeatures, function (el, index) {
            if(el.id == countryCode) {
                this.geoFeatures.splice(index, 1);
                return true;
            }

            return false;
        }, this);

        return this;
    };

    InMap.prototype.registerCountryHandler = function (instance) {
        return function (feature, layer) {
            feature.layer = layer;

            if(feature.id) {
                instance.countryLayers[feature.id] = layer;
                instance.countryGroup.addLayer(layer);
            }

            layer.on('mouseover', instance.mouseOverCountry.bind(instance));
            layer.on('mouseout', instance.mouseOutCountry.bind(instance));
        };
    };

    InMap.prototype.mouseOverCountry = function (event) {
        this.fire('hoverstart', event);
        event.target.setStyle(this.styles.hover);
    };

    InMap.prototype.mouseOutCountry = function (event) {
        this.fire('hoverend', event);
        if(event.target.isGoal) {
            event.target.setStyle(this.styles.goal);
        } else {
            event.target.setStyle(this.styles.base);
        }
    };

    InMap.prototype.getCountry = function (countryCode) {
        var layers = this.countryData._layers;

        for(var id in layers) {
            if (layers[id].feature.id === countryCode) {
                return layers[id];
            }
        }

        return false;
    };

    InMap.prototype.setGoal = function (countryCode) {
        var layer = this.getCountry(countryCode);

        if (layer) {
            this.setLayerOptions(layer, { className: 'inmap-country inmap-country--goal' });
            this.setLayerOptions(layer, this.styles.goal);
            layer.isGoal = true;
        }

        return this;
    };

    InMap.prototype.setBase = function (countryCode) {
        var layer = this.getCountry(countryCode);
        if(layer) {
            this.setLayerOptions(layer, { className: 'inmap-country inmap-country--base' });
            this.setLayerOptions(layer, this.styles.base);
            layer.isGoal = false;
        }
        return this;
    };

    InMap.prototype.highlightCountry = function (countryCode) {
        var layer = this.getCountry(countryCode);

        if (layer) {
            this.highlightGroup.addLayer(layer);
            this.setLayerOptions(layer, this.styles.highlight);
        }

        return this;
    };

    InMap.prototype.setLayerOptions = function (layer, options) {
        if(layer && layer.feature.geometry.type === "MultiPolygon") {
            L.featureGroup([layer]).setStyle(options);
        }

        if(layer && layer.feature.geometry.type === "Polygon") {
            L.setOptions(layer, options);
        }

        return this;
    };

    $.fn.inMap = function (mapbox_id, opts) {
        return new InMap(this.attr('id'), mapbox_id, opts);
    };

    $.fn.inMap.version = VERSION;

    return InMap;
});
