var fs             = require('fs')
  , matchdep       = require('matchdep')
  , moment         = require('moment')
  , version        = require('./package.json').version
  , rtVersion      = version.substr(0, version.lastIndexOf('.'))
  , revision       = Number(version.substr(version.lastIndexOf('.'))) + 1
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
			{ name: 'client/templates/header.html', data: {
					livereload: livereload,
					version: rtVersion,
					title: 'QTM Real-time Server Protocol documentation',
					date: moment().format("YYYY-MM-DD"),
				}
			},
			{ name: 'client/index.md', data: { version: rtVersion } },
			{ name: 'client/templates/footer.html' },
		],
		output: 'dist/index.html',
		debug: 'debug' == this.args[0],
		templateRoot: 'client/templates/',
	});

}

module.exports = function(grunt) {
	'use strict';

	matchdep.filterDev('grunt-*', './package.json')
		.forEach(grunt.loadNpmTasks);

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		fontelloUpdate: {
			mytask: {
				options: {
					config: 'fontello.json',
					fonts: 'client/font',
					css: 'client/font',
				},
			}
		},

		less: {
			options: {
				compress: true,
			},
			// Compile & minify less files.
			main: {
				src: ['client/styles/index.less'],
				dest: 'dist/styles/master.css',
			},
		},

		concat: {
			dist: {
				src: [
					'node_modules/jquery/dist/jquery.min.js',
					'node_modules/bootstrap/dist/js/bootstrap.min.js',
					'node_modules/highlightjs/highlight.pack.js',
					'client/js/debounce.js',
					'client/js/toc.js',
					'client/js/main.js'
				],
				dest: 'dist/js/app.js',
			},
		},

		jshint: {
			options: {
				jshintrc: '.jshintrc'
			},
			src: ['dist/js/app.js'],
		},

		copy: {
			dist: {
				files: [
					{
						expand: true,
						cwd: 'client/',
						src: [ 'images/**/*', 'font/**/*'],
						dest: 'dist/',
					},
				]
			}
		},

		clean: ['dist'],

		watch: {
			doq: {
				options: {
					spawn: false,
					livereload: { port: livereloadPort },
					atBegin: true,
				},
				files: ['client/**/*.md', 'client/templates/**/*.html', 'client/styles/**/*.less', 'client/js/**/*.js', 'client/images/**/*', './Gruntfile.js'],
				tasks: ['doq:debug'],
			},

			concat: {
				options: {
					spawn: false,
					atBegin: true,
				},
				tasks: ['concat'],
				files: 'client/js/*.js',
			},

			less: {
				options: {
					spawn: false,
					atBegin: true,
				},
				files: 'client/styles/*.less',
				tasks: ['less:main'],
			}
		}

	});

	grunt.registerTask('doq', 'Run doq.', doqRunner);
	grunt.registerTask('default', ['build']);
	grunt.registerTask('build', ['less', 'concat', 'copy', 'doq']);
};
