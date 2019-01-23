import * as essentials from 'witness-essentials-package'
import * as dsteem from 'dsteem'
import * as moment from 'moment'

import _g = require('./_g')
const config = _g.config

interface Options {
  node?: string,
  retries?: number,
  set_properties?: boolean
}

export let update_witness = async (current_signing_key: string, transaction_signing_key: string, props: dsteem.utils.WitnessProps, options: Options = {}) => {
  try {
    if (!options.retries) options.retries = 0

    if (options.set_properties) {
      await essentials.witness_set_properties(_g.client, _g.witness_data.witness, current_signing_key, props, transaction_signing_key)
    } else {
      await essentials.update_witness(_g.client, props.new_signing_key.toString(), _g.witness_data, transaction_signing_key)
    }

  } catch (error) {
    console.error(error)
    if (options.retries < 2) {
      await essentials.timeout(1)
      options.retries += 1
      await update_witness(current_signing_key, transaction_signing_key, props, options)
    } else {
      failover()
      options.retries = 0
      await update_witness(current_signing_key, transaction_signing_key, props, options)
    }
  }
}

export let get_witness = async (options: Options = { retries: 0 }) => {
  try {
    if (!options.retries) options.retries = 0

    let witness = await essentials.get_witness_by_account(_g.client, _g.witness_data.witness)
    return witness
  } catch (error) {
    console.error(error)
    if (options.retries < 2) {
      await essentials.timeout(1)
      options.retries += 1
      await get_witness(options)
    } else {
      failover()
      options.retries = 0
      await get_witness(options)
    }
  }
}

/**
 * Send all selected alert methods inside the config
 * @param force Whther sending should be forced
 */
export let send_alerts = async (subject, message, force = false) => {
  try {
    if (config.SMS.NEXMO || config.SMS.TWILIO) {
      essentials.log(`Sending SMS: ${subject}`)
      await essentials.send_sms(`Witness Watcher: ${subject}`, message, config.SMS_PROVIDER, _g.provider_data)
    } if (config.EMAIL.ENABLED) {
      essentials.log(`Sending Email: ${subject}`)
      await essentials.send_email(`Witness Watcher: ${subject}`, message, _g.mail_data)
    } if (config.TELEGRAM.ENABLED) {
      essentials.log(`Sending Telegram: ${subject}`)
      await essentials.send_telegram(message, _g.telegram_data)
    }
  } catch (error) {
    console.error('send_alert', error)
  }
}

export let failover = async () => {
  _g.current_node = essentials.failover_node(_g.config.RPC_NODES, _g.current_node)
  essentials.log(`Switched Node: ${_g.current_node}`)
  _g.client = new dsteem.Client(_g.current_node, { timeout: 8 * 1000 })
}

/**
 * Rotate through signing-keys, customized for witness-watcher. Remote uses a simpler version.
 */
export let update_signing_keys = () => {
  _g.USED_SIGNING_KEYS.push(_g.CURRENT_BACKUP_KEY.public)

  let index = _g.config.SIGNING_KEYS.indexOf(_g.CURRENT_BACKUP_KEY)
  if (index >= (_g.config.SIGNING_KEYS.length - 1)) {
    if (_g.config.ROTATE_KEYS && (_g.config.ROTATE_ROUNDS > _g.rotation_round || _g.config.ROTATE_ROUNDS === -1)) {
      _g.USED_SIGNING_KEYS = []
      _g.CURRENT_BACKUP_KEY = _g.config.SIGNING_KEYS[0]
      _g.rotation_round += 1
    } else {
      _g.CURRENT_BACKUP_KEY = { public: _g.NULL_KEY, private: '' }
    }
  } else {
    _g.CURRENT_BACKUP_KEY = _g.config.SIGNING_KEYS[index + 1]
  }
  
}

export let set_initial_witness = (x) => {
  _g.start_total_missed = x.total_missed
  _g.current_total_missed = _g.start_total_missed
  _g.witness_data.url = x.url
  _g.witness_data.props = x.props

  if (_g.config.SIGNING_KEYS.filter(y => y.public === x.signing_key).length <= 0) {
    _g.config.SIGNING_KEYS.push({ public: x.signing_key, private: '' })
  }
  _g.config.SIGNING_KEYS = essentials.order_keys(_g.config.SIGNING_KEYS, x.signing_key)
  _g.USED_SIGNING_KEYS = [x.signing_key]
  _g.CURRENT_BACKUP_KEY = essentials.get_next_key(_g.config.SIGNING_KEYS, x.signing_key, true)
}

export let set_transaction_signing_key = () => {
  _g.TRANSACTION_SIGNING_KEY = ''
}

export let check_missing_env = async () => {
  try {
    console.log('Checking config')

    const missing = []

    if (_g.config.SIGNING_KEYS.filter(x => x.private === '').length > 0 && !_g.config.ACTIVE_KEY) {
      console.log(`Missing private signing-keys or private active-key. If you don't want to use the private active key, make sure to add all your signing-keys (including your active one) with the correct private signing-key.`)
    }

    if (_g.config.SMS.NEXMO || _g.config.SMS.TWILIO) {
      let sms = _g.config.SMS
      if (!sms.API_KEY) missing.push('SMS > API_KEY')
      if (!sms.API_SECRET) missing.push('SMS > API_SECRET')
      if (!sms.PHONE_NUMBER) missing.push('SMS > PHONE_NUMBER')
      if (sms.TWILIO && !sms.FROM_NUMBER) missing.push('SMS > FROM_NUMBER')
    }

    if (_g.config.EMAIL.ENABLED) {
      let email = _g.config.EMAIL
      if (!email.GOOGLE_MAIL_ACCOUNT) missing.push('EMAIL > GOOGLE_MAIL_ACCOUNT')
      if (!email.GOOGLE_MAIL_PASSWORD) missing.push('EMAIL > GOOGLE_MAIL_PASSWORD')
      if (!email.EMAIL_RECEIVER) missing.push('EMAIL > EMAIL_RECEIVER')
    }

    if (_g.config.TELEGRAM.ENABLED) {
      let telegram = _g.config.TELEGRAM
      if (!telegram.BOT_TOKEN) missing.push('TELEGRAM > BOT_TOKEN')
      if (!telegram.USER_ID) missing.push('TELEGRAM > USER_ID')
    }

    if (missing.length > 0) {
      if (missing.length > 0) essentials.log(`Missing config variables: ${missing}`)
      process.exit()
    }

    console.log('Check was successful!')
    console.log('\n' + '----------------------------' + '\n')
  } catch (e) {
    console.error('check_missing_variables', e)
    essentials.log(`Exiting Process.`)
    process.exit(-1)
  }
}