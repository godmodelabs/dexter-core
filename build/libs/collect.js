var path = require('path'),
    walk = require('./walk'),
    is = require('../../js/libs/is'),
    systems = Object.keys(is);

function collect(root, foldername, cb) {
    walk(path.join(root, foldername), function(err, list) {
        if (err) { return cb(err); }

        var exp = new RegExp('(.*/'+foldername+')/');
        list = list.map(function(file) {
            file = file
                .replace(exp, '')
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

        cb(null, list);
    });
}

module.exports = collect;
