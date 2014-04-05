var fs = require('fs')
  , version   = require('./package.json').version
  , rtVersion = version.substr(0, version.lastIndexOf('.'))
  , revision  = version.substr(version.lastIndexOf('.') + 1)
  , livereloadPort = 9005
;

var doqRunner = function()
{
	var   doq        = require('doq')
		, livereload = ''
	;

	if ('debug' == this.args[0])
		livereload = '<script src="http://localhost:' + livereloadPort + '/livereload.js"></script>';

	doq({
		  templates: [
			//, { name: 'templates/majs.md', data: {} }
			  { name: 'templates/header.html', data: {
					  livereload: livereload
					, version: rtVersion
					, revision: revision
				}
			  }
			, { name: 'index.md', data: {} }
			, { name: 'templates/footer.html' }
		]
		, output: 'index.html'
		, debug: 'debug' == this.args[0]
		, templateRoot: 'templates/'
	});

}

module.exports = function(grunt) {
	"use strict";

	grunt.initConfig({
		  pkg: grunt.file.readJSON('package.json')

		, less: {
			options: {
				compress: true
			}
			// Compile & minify less files.
			, main: {
				  src: ['less/index.less']
				, dest: 'static/css/master.css'
			}
			, bootstrap: {
				  src: ['node_modules/twitter-bootstrap-3.0.0/less/bootstrap.less']
				, dest: 'static/css/lib/bootstrap.min.css'
			}
		}

		, watch: {
			  doq: {
				options: {
					  spawn: false
					, livereload: { port: livereloadPort }
					, atBegin: true
				}
				, files: ['**/*.md', 'templates/**/*.html', 'less/**/*.less', 'static/**/*', './Gruntfile.js']
				, tasks: ['doq:debug']
			}
			, less: {
				options: {
					  spawn: false
					, atBegin: true
				}
				, files: 'less/*.less'
				, tasks: ['less:main']
			}
		}

	});

	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-less');

	grunt.registerTask('doq', 'Run doq.', doqRunner);
	grunt.registerTask('default', ['less:bootstrap', 'less:main', 'doq']);
};
