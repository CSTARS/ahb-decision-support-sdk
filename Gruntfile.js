'use strict';

module.exports = function (grunt) {

  grunt.loadNpmTasks('grunt-browserify');
  var files = {
    'dist/lib.js': ['lib/index.js']
  };

  var browserifyOptions = {
    debug : true, // include source maps
    standalone : 'DSSDK'
  };

  grunt.initConfig({
     browserify: {
      build: {
        files: files,
        options: {
          browserifyOptions : browserifyOptions
        }
      },
      watch : {
        files: files,
        options: {
          browserifyOptions : browserifyOptions,
          keepAlive : true,
          watch : true,
          debug : true
        }
      }
     }
   });

    // Register group tasks
    grunt.registerTask('build', ['browserify:build']);
    grunt.registerTask('watch', ['browserify:watch']);
};
