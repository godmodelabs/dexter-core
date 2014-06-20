var fs = require('fs'),
    walk = require('./walk'),
    root = __dirname+'/../../../',
    viewFolder = 'js/views',
    viewFile = 'configs/dXViews.conf.js',
    views;

walk(root+viewFolder, function(err, views) {
    if (err) { throw err; }

    views = views.map(function(file) {
        return file
            .replace(/(.*\/js\/views)\//, '')
            .replace('.js', '')
            .replace(/\/|\\/, '!');
    });

    views = JSON.stringify(views);
    views = views.replace(/\["/, '[\n'+Array(9).join(' ')+'"')
        .replace(/"\]/, '"\n    ]')
        .replace(/,"/g, ',\n'+Array(9).join(' ')+'"');
    views = 'define(function() {\n    return '+views+';\n});';

    fs.writeFileSync(root+viewFile, views);
});