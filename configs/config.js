const convict = require('convict')

let config = convict({
  TEST_MODE: {
    doc: 'Broadcast transactions to the blockchain.',
    format: Boolean,
    default: false,
    arg: 'test'
  },
  RPC_NODES: {
    doc: 'Array of RPC-Nodes',
    format: '*',
    default: [
      "https://api.steemit.com",
      "https://api.steemitstage.com",
      "https://steemd.privex.io",
      "https://gtg.steem.house:8090",
      "https://steemd.minnowsupportproject.org"
    ],
    arg: "rpc"
  },
  WITNESS: {
    doc: 'Witness Name',
    format: String,
    default: 'witness-name',
    arg: 'witness'
  },
  ACTIVE_KEY: {
    doc: 'Private active key',
    format: String,
    default: ''
  },
  SIGNING_KEYS: {
    doc: 'Signing key pairs based on public and private',
    format: Array,
    default: [{ public: '', private: '' }]
  },
  INTERVAL: {
    doc: 'Interval in Minutes',
    format: Number,
    default: 10,
    arg: 'interval'
  },
  MISSED_BLOCKS_THRESHOLD: {
    doc: 'How many blocks can be missed until either keys should be switched or disabled?',
    format: Number,
    default: 1,
    arg: 'threshold'
  },
  ROTATE_KEYS: {
    doc: 'Should there be a rotation between your signing keys?',
    format: Boolean,
    default: false
  },
  ROTATE_ROUNDS: {
    doc: 'How often should be rotated between all your signing-keys',
    format: Number,
    default: 1
  },
  ALERT_AFTER_EVERY_MISSED: {
    doc: 'Settings for Alert Methods',
    format: '*',
    default: ''
  },
  SMS: {
    doc: 'Settings for Alert Methods',
    format: '*',
    default: {}
  },
  TELEGRAM: {
    doc: 'Settings for Alert Methods',
    format: '*',
    default: {}
  },
  EMAIL: {
    doc: 'Settings for Alert Methods',
    format: '*',
    default: {}
  }
})

config.loadFile('./configs/config.json')
config.validate({ allowed: 'strict' })

module.exports = config