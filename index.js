"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
var fs = require("fs");
var AdmZip = require('adm-zip');
var calcMd5 = require('md5');
var join = require('shamir').join;
var sodium = require('sodium-javascript');
var path = require('path');
var outputDir = 'output';
var keyFile = 'vault12.json';
var indexFile = 'index.json';
var dir = process.argv[2];
var vaultData;
var zipArchives;
getInputs();
findAssetShardsInArchives();
recombine();
function getInputs() {
    if (!dir) {
        throw new Error('First parameter should be directory');
    }
    if (!fs.lstatSync(dir).isDirectory()) {
        throw new Error(dir + " expect to be a directory");
    }
    var keyFilePath = workingDirPath(keyFile);
    if (!fs.lstatSync(keyFilePath).isFile()) {
        throw new Error("Expect " + dir + " to contain " + keyFilePath);
    }
    vaultData = JSON.parse(fs.readFileSync(keyFilePath, { encoding: 'utf-8' }));
    zipArchives = fs.readdirSync(dir).filter(function (p) { return path.extname(p) === '.zip'; });
    if (zipArchives.length < vaultData.shardsRequiredToUnlock) {
        throw new Error("According to your security setting you need to receive data from " + vaultData.shardsRequiredToUnlock + " guardians but have only " + zipArchives.length);
    }
}
function recombine() {
    var workingOutputDir = workingDirPath(outputDir);
    if (!fs.existsSync(workingOutputDir)) {
        fs.mkdirSync(workingOutputDir);
    }
    var masterKey = Buffer.from(vaultData.masterKey, 'base64');
    vaultData.assetsMetaData
        .forEach(function (asset) {
        var shardPaths = asset.shards.filter(function (shard) { return !!shard.path; }).map(function (shard) { return shard.path; });
        if (shardPaths.length < vaultData.shardsRequiredToUnlock) {
            console.error("Only " + shardPaths.length + " shards for file " + asset.name + " when " + vaultData.shardsRequiredToUnlock + " needed");
            return;
        }
        var buffers = shardPaths.map(function (path) { return fs.readFileSync(path); });
        var obj = {};
        /**
         * prepare for format required by shamir
         * 1st byte of file is index of shard the rest is data
         */
        buffers.forEach(function (v) { return obj[v[0]] = v.slice(1); });
        var cipher = join(obj);
        var nonce = Buffer.from(asset.nonce, 'base64');
        var plainText = Buffer.alloc(cipher.length - sodium.crypto_secretbox_MACBYTES);
        var res = sodium.crypto_secretbox_open_easy(plainText, cipher, nonce, masterKey);
        if (!res) {
            console.error("Failed to encrypt " + asset.name);
            return;
        }
        fs.writeFileSync(workingDirPath(outputDir, asset.name), plainText);
    });
    console.log("Assets successfully unlocked and stored in " + workingOutputDir);
}
function findAssetShardsInArchives() {
    zipArchives.forEach(function (zipArchive) {
        var archiveDirName = path.parse(zipArchive).name;
        var zip = new AdmZip(workingDirPath(zipArchive));
        zip.extractAllTo(workingDirPath(archiveDirName), true);
        var shards = JSON.parse(fs.readFileSync(workingDirPath(archiveDirName, indexFile), { encoding: 'utf-8' })).shards;
        vaultData.assetsMetaData.forEach(function (asset) {
            var foundShard = asset.shards.find(function (assetShard) {
                var foundShard = shards.find(function (_a) {
                    var shardId = _a.shardId;
                    return shardId === assetShard.id;
                });
                if (!foundShard) {
                    return false;
                }
                var shardPath = workingDirPath(archiveDirName, foundShard.fileName);
                validateFile(shardPath, assetShard.md5);
                assetShard.path = shardPath;
                return true;
            });
            if (!foundShard) {
                console.warn("Shard was not found for file " + asset.name + " in " + zipArchive);
            }
        });
    });
}
function validateFile(filePath, expectedMd5) {
    var fileData = fs.readFileSync(filePath);
    var md5 = calcMd5(fileData);
    if (md5 !== expectedMd5) {
        throw new Error("Wrong md5 for file " + filePath);
    }
}
function workingDirPath() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    return path.join.apply(path, __spreadArrays([dir], args));
}
