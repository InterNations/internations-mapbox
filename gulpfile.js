(function () {
    var gulp       = require('gulp');
    var rename     = require('gulp-rename');
    var uglify     = require('gulp-uglify');
    var jsdoc      = require('gulp-jsdoc');
    var watch      = require('gulp-watch');
    var livereload = require('gulp-livereload');
    var spawn      = require('child_process').spawn;
    var deploy     = require('gulp-gh-pages');
    var connect    = require('gulp-connect');

    var files = ['src/jquery.inMap.js'];

    gulp.task('scripts', function () {
        "use strict";

        gulp.src(files)
        .pipe(gulp.dest('dist'))
        .pipe(uglify({ mangle: false }))
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('dist'))
        ;
    });

    gulp.task('server', function (argument) {
        connect.server({
            port: 1234
        });
    });

    gulp.task('documentation', function () {
        "use strict";

        gulp.src(files)
        .pipe(jsdoc('dist/documentation'))
        ;
    });

    gulp.task('auto-reload', function() {
        "use strict";
        var process;

        function restart(e) {
            if (process) {
                process.kill();
            }

            process = spawn('gulp', ['default'], {stdio: 'inherit'});
        }

        gulp.watch('gulpfile.js', restart);
        restart();
    });

    gulp.task('deploy', function () {
        "use strict";
        gulp.src(['./index.html']).pipe(gulp.dest('gh-page'));
        gulp.src(['./lib/**/*']).pipe(gulp.dest('gh-page/lib'));
        gulp.src(['./src/**/*']).pipe(gulp.dest('gh-page/src'));
        gulp.src(['./documentation/**/*']).pipe(gulp.dest('gh-page/documentation'));

        gulp.src('./gh-page/**/*').pipe(deploy());
    });

    gulp.task('test', function () {
        var karma = spawn('karma', ['start']);
        karma.stdout.pipe(process.stdout);
    });

    gulp.task('build', ['scripts', 'documentation']);
    gulp.task('default', ['build', 'server', 'watch']);
    gulp.task('watch', function () {
        livereload.listen();
        "use strict";

        gulp.watch('src/*.js', ['build']);
        gulp.watch([ 'src/**/*', './index.html' ]).on('change', livereload.changed);
    });
})();
