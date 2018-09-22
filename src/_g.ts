import * as dsteem from 'dsteem'

export const NULL_KEY = 'STM1111111111111111111111111111111114T1Anm'

export let ORIG_KEY = ''
export let ACTIVE_KEY = ''
export let USED_SIGNING_KEYS = []
export let CURRENT_BACKUP_KEY = ''

export let rotation_round = 0

export let start_total_missed = 99999
export let current_total_missed = 99999

export let config = require('../configs/config.js').get()

export let current_node: string = config.RPC_NODES[0]
export let client: dsteem.Client = new dsteem.Client(current_node, { timeout: 8 * 1000 })

export let witness_data = {
  witness: config.WITNESS,
  props: config.PROPS || { account_creation_fee: '0.100 STEEM', maximum_block_size: 65536, sbd_interest_rate: 0 },
  url: 'https://steemit.com'
}

export let telegram_data = {
  bot_token: process.env.TELEGRAM_BOT_TOKEN,
  user_id: process.env.TELEGRAM_USER_ID
}

export let mail_data = {
  mail_account: process.env.GOOGLE_MAIL_ACCOUNT,
  mail_password: process.env.GOOGLE_MAIL_PASSWORD,
  to: process.env.EMAIL_TO
}

export let provider_data = {
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
  phone_number: process.env.PHONE_NUMBER,
  from_number: process.env.FROM_NUMBER
}

