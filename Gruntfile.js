var fs             = require('fs')
  , matchdep       = require('matchdep')
  , moment         = require('moment')
  , version        = require('./package.json').version
  , rtVersion      = version.substr(0, version.lastIndexOf('.'))
  , revision       = version.substr(version.lastIndexOf('.') + 1)
  , livereloadPort = 9005
;

var doqRunner = function()
{
	var doq        = require('doq')
	  , livereload = ''
	;

	if ('debug' == this.args[0])
		livereload = '<script src="http://localhost:' + livereloadPort + '/livereload.js"></script>';

	doq({
		  templates: [
			{ name: 'templates/header.html', data: {
					livereload: livereload,
					version: rtVersion,
					revision: revision,
					title: 'QTM Real-time Server Protocol documentation',
					date: moment().format("MMM Do YYYY"),
				}
			},
			{ name: 'index.md', data: {} },
			{ name: 'templates/footer.html' },
		],
		output: 'index.html',
		debug: 'debug' == this.args[0],
		templateRoot: 'templates/',
	});

}

module.exports = function(grunt) {
	'use strict';

	matchdep.filterDev('grunt-*', './package.json')
		.forEach(grunt.loadNpmTasks);

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		less: {
			options: {
				compress: true,
			},
			// Compile & minify less files.
			main: {
				src: ['less/index.less'],
				dest: 'static/css/master.css',
			},
			bootstrap: {
				src: ['node_modules/twitter-bootstrap-3.0.0/less/bootstrap.less'],
				dest: 'static/css/lib/bootstrap.min.css',
			}
		},

		concat: {
			dist: {
				src: ['js/debounce.js', 'js/toc.js', 'js/main.js'],
				dest: 'static/js/app.js',
			},
		},

		jshint: {
			options: {
				jshintrc: '.jshintrc'
			},
			src: ['static/js/app.js'],
		},

		watch: {
			doq: {
				options: {
					spawn: false,
					livereload: { port: livereloadPort },
					atBegin: true,
				},
				files: ['**/*.md', 'templates/**/*.html', 'less/**/*.less', 'js/**/*.js', 'static/**/*', './Gruntfile.js'],
				tasks: ['doq:debug'],
			},

			concat: {
				options: {
					spawn: false,
					atBegin: true,
				},
				tasks: ['concat'],
				files: 'js/*.js',
			},

			less: {
				options: {
					spawn: false,
					atBegin: true,
				},
				files: 'less/*.less',
				tasks: ['less:main'],
			}
		}

	});

	grunt.registerTask('doq', 'Run doq.', doqRunner);
	grunt.registerTask('default', ['less:bootstrap', 'less:main', 'doq']);
};
