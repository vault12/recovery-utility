#!/usr/bin/env node

import * as  fs from 'fs';
import { ExportAssetMetadata, ExportIndexFileModel, ExportVaultMetadata } from './models';
const AdmZip = require('adm-zip');
const calcMd5 = require('md5');
const { join } = require('shamir');
import { secretbox } from 'tweetnacl';
const pathLib = require('path');
const chalk = require('chalk');
const { version } = require('./package.json');

const outputDir = 'output';
const keyFile = 'vault12.json';
const indexFile = 'index.json';

console.log(chalk.whiteBright(`Vault12 Recovery Utility ${version}`));
console.log('-------------------');

const dir = getDirectory();
const vaultData = getVaultData();
const zipArchives = getZipArchives();
findAssetShardsInArchives();
const workingOutputDir = createDir(path(outputDir));
restoreAssets();

function getDirectory() {
  const dir = process.argv[2];
  if (!dir) {
    throw new Error('First parameter should be a directory');
  }
  if (!fs.lstatSync(dir).isDirectory()) {
    throw new Error(`${dir} expected to be a directory`);
  }
  return dir;
}

function getVaultData(): ExportVaultMetadata {
  const keyFilePath = path(keyFile);
  if (!fs.lstatSync(keyFilePath).isFile()) {
    throw new Error(`Expected ${dir} to contain ${keyFilePath}`);
  }
  return JSON.parse(fs.readFileSync(keyFilePath, { encoding: 'utf-8' }));
}

function getZipArchives() {
  const zipArchives = fs.readdirSync(dir).filter(p => pathLib.extname(p) === '.zip');

  if (zipArchives.length < vaultData.shardsRequiredToUnlock) {
    throw new Error(`According to your security policy, you need to receive data from ${vaultData.shardsRequiredToUnlock} guardians, but you provided only ${zipArchives.length}`);
  }

  return zipArchives;
}

function restoreAssets() {
  const masterKey = Buffer.from(vaultData.masterKey, 'base64');
  const assetsCount = vaultData.assetsMetaData.length;

  vaultData.assetsMetaData.forEach((asset, i) => {
    process.stdout.write(`${chalk.yellow(`${i+1}/${assetsCount}`)} Unlocking ${chalk.bold(asset.name)}... `);
    let recombinedFile: Buffer;
    try {
      recombinedFile = recombineAsset(asset)
    } catch (error) {
      console.error(`Failed to recover ${asset.name}`, error);
      return;
    }
    let plainText: Uint8Array;
    try {
      plainText = decryptAsset(asset, recombinedFile, masterKey)
    } catch (error) {
      console.error(`Failed to decrypt ${asset.name}`, error);
      return;
    }
    fs.writeFileSync(path(outputDir, asset.name), plainText);
    process.stdout.write(chalk.green('✓') + '\n');
  })
  console.log(chalk.green(`Assets successfully unlocked and stored in ${workingOutputDir}`));
}

function createDir(workingOutputDir: string) {
  if (!fs.existsSync(workingOutputDir)) {
    fs.mkdirSync(workingOutputDir);
  }
  return workingOutputDir;
}

function findAssetShardsInArchives() {
  console.log(`Validating Vault...`);
  zipArchives.forEach(zipArchive => {
    const archiveDirName = pathLib.parse(zipArchive).name;

    new AdmZip(path(zipArchive)).extractAllTo(path(archiveDirName), true);

    const { shards } = getArchiveIndex(archiveDirName);

    vaultData.assetsMetaData.forEach(asset => {
      const foundShard = asset.shards.find((assetShard) => {
        const foundShard = shards.find(({ shardId }) => shardId === assetShard.id);
        if (!foundShard) {
          return false;
        }
        const shardPath = path(archiveDirName, foundShard.fileName);
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

function getArchiveIndex(archiveDirName: string) {
  return JSON.parse(fs.readFileSync(path(archiveDirName, indexFile), { encoding: 'utf-8' })) as ExportIndexFileModel;
}

function validateFile(filePath: string, expectedMd5: string) {
  if (!expectedMd5) {
    // skipping md5 verification, likely legacy asset detected
    return;
  }
  const fileData = fs.readFileSync(filePath);
  const md5 = calcMd5(fileData);
  if (md5 !== expectedMd5) {
    throw new Error(`Wrong md5 for file ${filePath}`);
  }
}

function path(...args: string[]) {
  return pathLib.join(dir, ...args);
}

function recombineAsset(asset: ExportAssetMetadata) {
  const shardPaths = asset.shards.filter(shard => !!shard.path).map(shard => shard.path);

  if (shardPaths.length < vaultData.shardsRequiredToUnlock) {
    console.error(`Only ${shardPaths.length} shards found for asset ${asset.name} when ${vaultData.shardsRequiredToUnlock} needed`);
    return;
  }
  /**
  * prepare for format required by shamir
  * 1st byte of file is index of shard the rest is data
  */
  const buffers = shardPaths.map((path) => fs.readFileSync(path));
  const obj = {};
  buffers.forEach((v) => obj[v[0]] = v.slice(1));
  return join(obj);
}

function decryptAsset(asset: ExportAssetMetadata, encryptedData: Buffer, masterKey: Buffer) {
  const nonce = Buffer.from(asset.nonce, 'base64');
  const decrypted = secretbox.open(encryptedData, nonce, masterKey);
  if (!decrypted) {
    throw new Error(`Failed to decrypt ${asset.name}`);
  }
  return decrypted;
}
