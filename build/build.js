var fs = require('fs'),
    path = require('path'),
    walk = require('./libs/walk'),
    root = fs.existsSync('../parent')? '../parent':'../../../',
    config = require(path.join(root, 'configs/dX.json')),
    mainConfig = require(path.join(root, 'js/main')),
    target = 'configs/dXBuild.min.js',
    viewFolder = 'js/views',
    templateFolder = 'templates',
    snippetFolder = 'snippets',
    views,
    templates,
    includes = [],
    result;

function getFiles(cb) {
    var ret = {};
    walk(path.join(root, viewFolder), function(err, views) {
        if (err) { return cb(err); }
        ret.views = views;

        if (!config.build.snippets && !config.build.templates) {
            return cb(null, ret);
        }

        walk(path.join(root, config.build.templates? templateFolder:snippetFolder), function(err, templates) {
            if (err) { return cb(err); }
            ret.templates = templates;

            if (config.build.snippets && config.build.templates) {
                walk(path.join(root, snippetFolder), function (err, snippets) {
                    if (err) { return cb(err); }

                    ret.templates = ret.templates.concat(snippets);
                    cb(null, ret);
                });

            } else { cb(null, ret); }
        });
    });
}

getFiles(function(err, list) {
    if (err) { throw err; }

    includes = includes.concat(list.views.map(function(file) {
        return file.replace(/(.*\/js\/views)/, 'views').replace(/\.js$/, '');
    }));

    if ('templates' in list) {
        includes = includes.concat(list.templates.map(function(file) {
            return 'text!'+file.replace(/.*\/(templates|snippets)/, '$1');
        }));
    }

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

    fs.writeFileSync(path.join(root, target), '('+JSON.stringify(result)+')');
});