import * as  fs from 'fs';
import { ExportIndexFileModel, ExportVaultMetadata } from './models';
const AdmZip = require('adm-zip');
const calcMd5 = require('md5');
const { join } = require('shamir');
const sodium = require('sodium-javascript')
const path = require('path');

const outputDir = 'output';
const keyFile = 'vault12.json';
const indexFile = 'index.json';
const dir = process.argv[2];
let vaultData: ExportVaultMetadata;
let zipArchives: string[];

getInputs();
findAssetShardsInArchives();
recombine();

function getInputs() {
  if (!dir) {
    throw new Error('First parameter should be directory');
  }

  if (!fs.lstatSync(dir).isDirectory()) {
    throw new Error(`${dir} expect to be a directory`);
  }

  const keyFilePath = workingDirPath(keyFile);
  if(!fs.lstatSync(keyFilePath).isFile()) {
    throw new Error(`Expect ${dir} to contain ${keyFilePath}`);
  }

  vaultData = JSON.parse(fs.readFileSync(keyFilePath, {encoding: 'utf-8'}));
  zipArchives = fs.readdirSync(dir).filter(p => path.extname(p) === '.zip');

  if (zipArchives.length < vaultData.shardsRequiredToUnlock) {
    throw new Error(`According to your security setting you need to receive data from ${vaultData.shardsRequiredToUnlock} guardians but have only ${zipArchives.length}`);
  }
}

function recombine() {
  const workingOutputDir = workingDirPath(outputDir);
  if (!fs.existsSync(workingOutputDir)){
    fs.mkdirSync(workingOutputDir);
  }
  const masterKey = Buffer.from(vaultData.masterKey, 'base64');
  vaultData.assetsMetaData
  .forEach(asset => {
    const shardPaths = asset.shards.filter(shard => !!shard.path).map(shard => shard.path);
    if (shardPaths.length < vaultData.shardsRequiredToUnlock) {
      console.error(`Only ${shardPaths.length} shards for file ${asset.name} when ${vaultData.shardsRequiredToUnlock} needed`);
      return;
    }
    const buffers = shardPaths.map((path) => fs.readFileSync(path));
    const obj = {};
    /**
     * prepare for format required by shamir
     * 1st byte of file is index of shard the rest is data
     */
    buffers.forEach((v) => obj[v[0]]=v.slice(1));
    const cipher = join(obj);
    const nonce  = Buffer.from(asset.nonce, 'base64');
    const plainText = Buffer.alloc(cipher.length - sodium.crypto_secretbox_MACBYTES);
    const res = sodium.crypto_secretbox_open_easy(plainText, cipher, nonce, masterKey);
    if (!res) {
      console.error(`Failed to encrypt ${asset.name}`);
      return;
    }
    fs.writeFileSync(workingDirPath(outputDir, asset.name), plainText);
  })
  console.log(`Assets successfully unlocked and stored in ${workingOutputDir}`);
}


function findAssetShardsInArchives() {
  zipArchives.forEach(zipArchive => {
    const archiveDirName = path.parse(zipArchive).name;
    const zip = new AdmZip(workingDirPath(zipArchive));
    zip.extractAllTo(workingDirPath(archiveDirName), true);
    const {shards} = JSON.parse(fs.readFileSync(workingDirPath(archiveDirName, indexFile), {encoding: 'utf-8'})) as ExportIndexFileModel;
    vaultData.assetsMetaData.forEach(asset => {
      const foundShard = asset.shards.find((assetShard) => {
        const foundShard = shards.find(({shardId}) => shardId === assetShard.id);
        if (!foundShard) {
          return false;
        }
        const shardPath = workingDirPath(archiveDirName, foundShard.fileName);
        validateFile(shardPath, assetShard.md5);
        assetShard.path = shardPath;
        return true;
      });
      if (!foundShard) {
        console.warn(`Shard was not found for file ${asset.name} in ${zipArchive}`);
      }
    })
  })
}


function validateFile(filePath:  string, expectedMd5: string) {
  const fileData = fs.readFileSync(filePath);
  const md5 = calcMd5(fileData);
  if (md5 !== expectedMd5) {
    throw new Error(`Wrong md5 for file ${filePath}`);
  }
}

function workingDirPath(...args: string[]) {
  return path.join(dir, ...args);
}
