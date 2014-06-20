var fs = require('fs'),
    walk = require('./walk'),
    root = __dirname+'/../../../',
    viewFolder = 'js/views',
    viewFile = 'configs/dXViews.conf.js',
    views;

views = fs.readdirSync(root+viewFolder);

views = views.map(function(file) {
    return file.replace(/\.js/, '');
});

views = JSON.stringify(views);
views = views.replace(/\["/, '[\n'+Array(9).join(' ')+'"')
             .replace(/"\]/, '"\n    ]')
             .replace(/,"/g, ',\n'+Array(9).join(' ')+'"');
views = 'define(function() {\n    return '+views+';\n});';

fs.writeFileSync(root+viewFile, views);