const convict = require('convict')

let config = convict({
  RPC_NODES: {
    doc: 'Array of RPC-Nodes',
    format: '*',
    default: [
      "https://api.steemitstage.com",
      "https://steemd.privex.io",
      "https://gtg.steem.house:8090",
      "https://rpc.buildteam.io",
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
  TEST_MODE: {
    doc: 'Broadcast transactions to the blockchain.',
    format: Boolean,
    default: false,
    arg: 'test'
  },
  SIGNING_KEYS: {
    doc: 'Array of Signing-Keys (besides currently active)',
    format: '*',
    default: [],
    arg: "keys"
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
  PROPS: {
    doc: 'Properties for Witness',
    format: '*',
    default: [{
      "account_creation_fee": "0.200 STEEM",
      "maximum_block_size": 65536,
      "sbd_interest_rate": 0
    }]
  },
  ALERT_METHODS: {
    doc: 'Which alert methods should be used',
    format: '*',
    default: ["EMAIL", "SMS", "TELEGRAM"]
  },
  SMS_PROVIDER: {
    doc: 'SMS Provider',
    format: ["nexmo", "twilio"],
    default: 'nexmo'
  },
  ALERT_AFTER_EVERY_MISSED: {
    doc: 'Should there be an Alert after every missed?',
    format: Boolean,
    default: true
  }
})

config.loadFile('./configs/config.json')
config.validate({ allowed: 'strict' })

module.exports = config