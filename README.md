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
## How to use
1. Install [nodejs](https://nodejs.org/uk/)
2. Open terminal
3. Run `npm i -g @vault12/recovery-utility`
4. Export external vault on guardian devices `Settings > Advanced > Export Data for External Vault`
5. Export your vault master key `Settings > Advanced > Export My Vault’s Decryption Key`
6. Put all exported files to same directory `/directory/with/exported/files`
7. In terminal run `@vault12-recovery /directory/with/exported/files`
8. All files will be recovered in `/directory/with/exported/files/output`

## License

RingCypher is released under the [MIT License](http://opensource.org/licenses/MIT).

## Legal Reminder

Exporting/importing and/or use of strong cryptography software, providing cryptography hooks, or even just communicating technical details about cryptography software is illegal in some parts of the world. If you import this software to your country, re-distribute it from there or even just email technical suggestions or provide source patches to the authors or other people you are strongly advised to pay close attention to any laws or regulations which apply to you. The authors of this software are not liable for any violations you make - it is your responsibility to be aware of and comply with any laws or regulations which apply to you.
