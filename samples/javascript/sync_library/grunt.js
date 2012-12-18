/*global module:false*/
module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-requirejs');
  
  // Project configuration.
  grunt.initConfig({
    pkg: '<json:package.json>',
    meta: {
      banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        ' * <%= pkg.licenses.url %> \n' +
        ' * Copyright (c) <%= grunt.template.today("yyyy") %> ' +
        '<%= pkg.licenses.company %> */' 
    },
       
    requirejs:{
         baseUrl:'.',
         mainConfigFile: "main.js",
         optimize: "uglify",
        //optimize: "none",
         name: 'fileSync',
         include:["davFSAdapter","localFSAdapter","shipper","localLogger"],
         //out:"dist/cloudfs.js"
        out:"dist/cloudfs.min.js"
      /* {
         baseUrl:'.',
         mainConfigFile: "main.js",
         optimize: "uglify",
         name: 'fileSync',
         include:["davFSAdapter","localFSAdapter","localLogger"],
         out:"cloudfs.min.js"
       }*/
    },
    lint: {
      files: ['grunt.js', 'lib/fs/*.js']
    },
    mocha: {
      index: ['runner.html']
    },

    concat: {
       'dist/cloudfs.js':['lib/vendor/**/*.js','lib/fs/*.js']
    //dist: {
      //  src: ['<banner:meta.banner>', 'lib/vendor/**/*.js','lib/fs/*.js'],
       // dest: 'dist/<%= pkg.name %>.js'
      //}*/
    },
    min: {
      dist: {
        src: ['<banner:meta.banner>', '<config:concat.dist.dest>'],
        dest: 'dist/<%= pkg.name %>.min.js'
      }
    },
    watch: {
      files: '<config:lint.files>',
      tasks: 'lint'
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        browser: true
      },
      globals: {
        require: true,
        define: true,
        console: true
      }
          },
    uglify: {}
  });

  //grunt.loadNpmTasks('grunt-mocha');
  // Default task.
  //grunt.registerTask('default', 'lint concat min');
  grunt.registerTask('default', 'requirejs');
};
