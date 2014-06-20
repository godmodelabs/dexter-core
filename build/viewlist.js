var fs = require('fs'),
    walk = require('./walk'),
    root = __dirname+'/../../../',
    viewFolder = 'js/views',
    viewFile = 'configs/dXViews.conf.js',
    is = require('../js/libs/is'),
    systems = Object.keys(is),
    views;

walk(root+viewFolder, function(err, views) {
    if (err) { throw err; }

    views = views.map(function(file) {
        file = file
            .replace(/(.*\/js\/views)\//, '')
            .replace('.js', '');

        var s = file.split('/');
        if (s.length > 1) {
            for (var i=s.length; i--;) {
                if (systems.indexOf(s[i]) >= 0) {
                    s[i] += '!';
                } else {
                    s[i] += '/';
                }
            }
            file = s.join('');
            file = file.substring(0, file.length - 1);
        }
        return file;
    });

    views = JSON.stringify(views);
    views = views.replace(/\["/, '[\n'+Array(9).join(' ')+'"')
        .replace(/"\]/, '"\n    ]')
        .replace(/,"/g, ',\n'+Array(9).join(' ')+'"');
    views = 'define(function() {\n    return '+views+';\n});';

    fs.writeFileSync(root+viewFile, views);
});