var fs = require('fs'),
    path = require('path'),
    collect = require('./libs/collect'),
    root = fs.existsSync('../parent')? '../parent':'../../../',
    file = 'configs/dX.json',
    config;

try { config = require(path.join(root, file)); }
catch(err) { config = {}; }

function collectFiles(cb) {
    collect(root, 'snippets', function(err, list) {
        config.snippets = list;

        collect(root, 'js/views', function(err, list) {
            config.views = list;
            cb();
        });
    });
}

function wrapWithStyle(obj) {
    function ind(count) { return Array(count*4+1).join(' '); }

    function style(obj, indent) {
        var result = "";

        for (var property in obj) {
            if (!obj.hasOwnProperty(property)) { continue; }
            var value = obj[property];

            if (typeof value == 'string') {
                value = "\"" + value + "\"";

            } else if (typeof value == 'object') {
                if (value instanceof Array) {
                    value = "[\n" + indent+ind(1) + "\"" + value.join("\",\n"+indent+ind(1)+"\"") + "\"\n"+indent+"]";
                } else {
                    var od = style(value, indent + ind(1));
                    value = "{\n" + od + "\n" + indent + "}";
                }
            }
            result += indent + "\"" + property + "\": " + value + ",\n";
        }
        return result.replace(/,\n$/, "");
    }

    return '{\n'+style(obj, ind(1))+'\n}';
}


collectFiles(function() {
    fs.writeFileSync(path.join(root, file), wrapWithStyle(config));
});