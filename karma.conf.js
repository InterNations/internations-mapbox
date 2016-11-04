module.exports = function(config) {
    'use strict';
    config.set({
        basePath: '',
        frameworks: ['jasmine', 'requirejs'],
        files: [
            {pattern: 'lib/**/*.min.js', included: false},
            {pattern: 'src/**/*.js', included: false},
            {pattern: 'test/**/*Spec.js', included: false},
            {pattern: 'test/matchers.js', included: false},
            {pattern: 'test/fixtures.js', included: false},
            {pattern: 'lib/mapbox.js/dist/mapbox.js', included: false},
            'test/test-main.js'
        ],
        exclude: [
            'src/main.js'
        ],
        reporters: ['progress'],

        preprocessors: {
            'src/jquery.inMap.js': ['coverage']
        },
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: true,
        browsers: ['PhantomJS', 'Chrome'],
        singleRun: false
    });
};
