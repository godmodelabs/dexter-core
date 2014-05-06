var fs = require('fs'),
    walk = require('./walk'),
    root = __dirname+'/../../../',
    mainConfig = require('../../../js/main.js'),
    target = 'configs/dXBuild.min.js',
    viewFolder = 'js/views',
    templateFolder = 'templates',
    views,
    templates,
    includes = [],
    result;

//views = fs.readdirSync(root+viewFolder);
walk(root+viewFolder, function(err, views) {
    if (err) { throw err; }

    includes = includes.concat(views.map(function(file) {
        return file.replace(/(.*\/js\/views)/, 'views');
    }));

    walk(root+templateFolder, function(err, templates) {
        if (err) { throw err; }

        includes = includes.concat(templates.map(function(file) {
            return 'text!'+file.replace(/(.*\/templates)/, 'templates');
        }));

        result = {
            baseUrl: '../js',

            name: 'main',
            out: '../js/main-build.js',
            //optimize: 'none',
            findNestedDependencies: true,
            preserveLicenseComments: false,
            "insertRequire": ["main"],
            include: includes,
            uglify: { max_line_length: 500 },

            paths: mainConfig.paths,
            shim: mainConfig.shim,

            // Enforce define to catch 404 errors in IE
            enforceDefine: true
        };

        fs.writeFileSync(root+target, '('+JSON.stringify(result)+')');
    });
});
