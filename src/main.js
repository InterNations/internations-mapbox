(function (requirejs) {
    'use strict';

    requirejs.config({
        paths: {
            'jquery': '/lib/jquery/dist/jquery.min',
            'underscore': '../lib/lodash/dist/lodash.underscore.min',
            'mapbox': '../lib/mapbox.js/mapbox.uncompressed',
            'leaflet.markercluster': '../lib/Leaflet.markercluster/dist/leaflet.markercluster-src'
        },
        shim: {
            'leaflet.markercluster': {
                'deps': ['mapbox']
            }
        }
    });

    define(['jquery', 'jquery.inMap'], function ($, inmap) {
        var map = window.the_map = $('#basic_map').inMap('lstrojny.0cf22f83', {
            paddingTopLeft: [200, 0]
        });
        var clusteredMap = window.the_clustered_map = $('#clustered_map').inMap('lstrojny.0cf22f83', {
            paddingTopLeft: [200, 0],
            markerClusteringOptions: {
                maxClusterRadius: 50,
                showCoverageOnHover: false,
                chunkedLoading: true,
                disableClusteringAtZoom: 7
            }
        });
        clusteredMap.enableMarkerClustering();

        $.getJSON("/fixtures-3.json", {}, function (data) {
            var markers = _.map(data.popovers, function(marker, index) {
                return {
                    index: index,
                    position: [marker.coordinates.lat, marker.coordinates.lng],
                    country: marker.iocCode,
                    description: marker.name
                };
            });

            clusteredMap.addMarkers(markers);
            clusteredMap.zoomAll();
        });

 		$.getJSON("/fixtures.json", {}, function (data) {
            console.log(data);
            map.addCountryData(data);

            map.addMarker({
                position: [53, 10],
                country: 'DEU',
                title: 'First Marker',
                icon: 'marker3.gif'
            });

            map.addMarker({
                position: [52, -1],
                country: 'GBR',
                description: 'The Description<br>with some<br>breaks in it<br>to be higher',
                icon: 'marker.png'
            });

            map.addMarker({
                position: [52, -1],
                country: 'GBR',
                description: 'SECOND GBR THING',
                icon: 'marker.png'
            });

            map.addMarker({
                position: [45, 2],
                country: 'FRA',
                descriptionSelector: ".sample_content",
                icon: 'marker2.gif'
            });

            map.setGoal('GBR');
            map.zoomCountries();
        });

        map.on('zoomend', function (e) {
            console.log("zooming finished");
        });

        _.each(map.markers, function (e, r) {
            e.addEventListener("marker:click", function () {
                map.zoomAt(r);
            });
        });

        $('.next').click(function (e) {
            e.preventDefault();
            map.zoomNext(function () {
                console.log('next finished');
            });
        });

        $('.prev').click(function (e) {
            e.preventDefault();
            map.zoomPrev(function () {
                console.log('prev finished');
            });
        });

        $('.all').click(function (e) {
            e.preventDefault();
            map.zoomAll();
        });

        $('.all--countries').click(function (e) {
            e.preventDefault();
            map.zoomCountries();
        });

        $('.load-more').click(function (e) {
            e.preventDefault();
            $.getJSON("/fixtures-2.json", {}, function (data) {
                console.log(data);
                map.addCountryData(data);
            });
        });

        $('.remove').click(function () {
            map.removeCountryCode('BRR');
            map.removeMarker(2);
        });
    });
})(window.requirejs);
