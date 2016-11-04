# Technical Concept

The technical concept can now be found in the [wiki][tc]

# Instructions

- Add `mapbox` to requirejs' paths: `https://api.tiles.mapbox.com/mapbox.js/v1.6.1/mapbox`
- Require 'jquery.inMap'.

## Example:

    define(['jquery', 'jquery.inMap'], function ($, inmap) {
        var map = $('#basic_map').inMap('noxoc.iie3m4pe');
        map.addMarker([53.5, 8.3]);
        map.addMarker({
            position: [40, 8],
            title: 'Some title',
            description: 'Some description'
        });
    });

A map can also be directly initialized with markers.

    var markers = [{
            position: [10, 20]
        }, {
            position: [20, 10],
            title: 'Some Title',
            description: 'The Description'
        }, {
            position: [30, 20],
            title: 'Some Title',
            // can also take HTMLNodes for the description
            description: $('.sample_content')[0];
        }];

    var map = $('#basic_map').inMap('noxoc.iie3m4pe', markers);

# Rough Roadmap

## 0.1 marker
- [x] Basic initialisation of map via `$(element).inMap(map_id)`
- [x] Add build tools to generate docs and minified versions
- [x] Add simple markers through simplified API wrapper
- [x] Add more advanced markers
- [x] Add markers with the content of a dom-node as infowindows
- [x] Add multiple markers with `addMarkers([])`
- [x] Add markers on initialisation with JSON

## 0.2 zooming
- [x] zoom to specific points: `.setZoom(args)`
- [x] zoom at a specific marker: `.zoomAt(i)`
- [x] cycle through markers: `.zoomPrev(args)` and `.zoomNext(args)`;
- [x] set bounds to view all markers: `.zoomAll(args)`

## 0.3 countries
- [x] provide a method to add country data (geojson) to map
- [x] handle mouse events on feature layers
- [x] highlight countries: `.highlight('DEU')`
- [x] auto-highlight countries with markers

## 0.4 enhanced zooming
- [x] zooming on markers opens its tooltip
- [x] zooming on a marker sets the view bounds to the country the marker is in.
- [x] provide a way to set the offset that's taken into account when zooming

## 0.5 marker clustering
- [x] allow grouping markers into clusters at low zoom levels

[tc]: https://github.com/Vortrieb/internations-mapbox/wiki/Technical-Concept
