<p align="center">
  <img src="https://user-images.githubusercontent.com/1370944/109153827-15c4d700-7776-11eb-93c0-6801f8d618b0.jpg"
    alt="Vault12 Recovery Utility">
</p>

<p align="center">
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="MIT License" />
  </a>
  <img src="https://img.shields.io/david/vault12/recovery-utility" alt="Dependencies" />
  <a href="http://makeapullrequest.com">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs welcome" />
  </a>
  <a href="https://twitter.com/_Vault12_">
    <img src="https://img.shields.io/twitter/follow/_Vault12_?label=Follow&style=social" alt="Follow" />
  </a>
</p>

# Overwiew

A command-line utility for recovering assets from the raw data exported from Vault12 mobile app.

## Installation

1. Install [node](https://nodejs.org/)
2. Install the package globally:
```
$ npm i -g vault12-recovery
```
## Usage

1. Export the decryption key (`vault12.json`) from the Vault12 app: *Settings > Advanced > Export My Vault’s Decryption Key*
2. Collect the raw Vault data from several Guardian devices via *Settings > Advanced > Export Data for External Vault*. You'll need to collect the amount of files equal to the **Number of Confirmations** you selected when creating the Vault.
3. Place all exported archives and `vault12.json` file in the same directory, e.g. `~/vault12-files`.
4. In terminal, run
```
$ vault12-recovery ~/vault12-files
```
5. You should find all recovered assets from the Vault in the directory `~/vault12-files/output`.

## License

RingCypher is released under the [MIT License](http://opensource.org/licenses/MIT).

## Legal Reminder

Exporting/importing and/or use of strong cryptography software, providing cryptography hooks, or even just communicating technical details about cryptography software is illegal in some parts of the world. If you import this software to your country, re-distribute it from there or even just email technical suggestions or provide source patches to the authors or other people you are strongly advised to pay close attention to any laws or regulations which apply to you. The authors of this software are not liable for any violations you make - it is your responsibility to be aware of and comply with any laws or regulations which apply to you.
