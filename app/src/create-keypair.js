const fs = require('fs')
const anchor = require("@project-serum/anchor")
const path = require('path');

const account = anchor.web3.Keypair.generate()
console.log('👾👾👾:::', account);
fs.writeFileSync(path.resolve(__dirname, 'keypair.json'), JSON.stringify(account))
