var Mocha = require('mocha');
var fs = require('fs');
var path = require('path');

desc('Just run the tests');
task('test', [], function (params) {
    var mocha = new Mocha({
        ui: 'bdd',
        reporter: 'spec'
    });
    lookupFiles('test', true).forEach(function(file) { mocha.addFile(file) });
    mocha.run();
});

function lookupFiles(currentPath, recursive) {
    var files = [];

    if (!(fs.existsSync(currentPath) || path.existsSync(currentPath))) currentPath += '.js';
    var stat = fs.statSync(currentPath);
    if (stat.isFile()) return currentPath;

    fs.readdirSync(currentPath).forEach(function(file){
        file = path.join(currentPath, file);
        var stat = fs.statSync(file);
        if (stat.isDirectory()) {
            if (recursive) files = files.concat(lookupFiles(file, recursive));
            return
        }

        var re = new RegExp('\\.(js)$');
        if (!stat.isFile() || !re.test(file) || path.basename(file)[0] == '.') return;
        files.push(file);
    });

    return files;
}