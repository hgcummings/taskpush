var Mocha = require('mocha');
var fs = require('fs');
var path = require('path');

var mocha = new Mocha({
    ui: 'bdd',
    reporter: 'spec'
});
addTestFiles(mocha);
mocha.run();

function addTestFiles(mocha) {
    lookupFiles('test').forEach(function (file) {
        mocha.addFile(file)
    });
}

function lookupFiles(currentPath) {
    var sourceRegex = new RegExp('\\.(js)$');
    var files = [];

    if (!(fs.existsSync(currentPath) || path.existsSync(currentPath))) currentPath += '.js';
    var stat = fs.statSync(currentPath);
    if (stat.isFile()) return currentPath;

    fs.readdirSync(currentPath).forEach(function(file){
        file = path.join(currentPath, file);
        var stat = fs.statSync(file);
        if (stat.isDirectory()) {
            files = files.concat(lookupFiles(file));
        } else {
            if (stat.isFile() && sourceRegex.test(file) && path.basename(file)[0] !== '.') {
                files.push(file);
            }
        }
    });

    return files;
}