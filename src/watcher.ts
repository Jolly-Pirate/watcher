require('dotenv').config()
import * as essentials from 'witness-essentials-package'

import { check_missing_env, update_witness, set_initial_witness, update_signing_keys, send_alerts } from './helpers'

import _g = require('./_g')
import moment = require('moment');

let test_block_count = 1

export const start_witness_watcher = async (IS_TESTING = false, NOTIFY = true, FAILOVER = true, DISABLE = true) => {
  try {
    while (true) {
      let b = await watch_witness(IS_TESTING, NOTIFY, FAILOVER, DISABLE)

      // If we're testing, leave once disabled
      if(b && IS_TESTING) {
        return
      }

      await essentials.timeout(IS_TESTING ? 2 : _g.config.INTERVAL * 60)
    }
  } catch (e) {
    console.error('start', e)
    await start_witness_watcher(IS_TESTING, NOTIFY, FAILOVER)
  }
}

let watch_witness = async (IS_TESTING, NOTIFY, FAILOVER, DISABLE) => {
  try {
    await initiate_watcher(IS_TESTING)

    let witness: { signing_key: string, total_missed: number } = await essentials.get_witness_by_account(_g.client, _g.witness_data.witness)

    // Was witness manually disabled?
    if (witness.signing_key === _g.NULL_KEY) {
      essentials.log('Witness is disabled - skipping checking.')
      return
    }

    // If we're testing, add one missed block
    if (IS_TESTING) {
      essentials.log('TEST-MODE: Adding an imaginary missed block')
      witness.total_missed += test_block_count
      test_block_count += 1
    }

    // Was the current signing key manually changed?
    else if (witness.signing_key === _g.CURRENT_BACKUP_KEY.public) {
      update_signing_keys()
    }

    // New missed block?
    if (witness.total_missed > _g.current_total_missed) {
      return await handle_missed_block(witness, IS_TESTING, NOTIFY, FAILOVER, DISABLE)
    }
    return false
  } catch (error) {
    console.error('watch_witness', error)
    await essentials.timeout(5)
    await watch_witness(IS_TESTING, NOTIFY, FAILOVER, DISABLE)
  }
}

let initiate_watcher = async (IS_TESTING) => {
  if (_g.start_total_missed === 99999) {
    console.log('\n----------------------------\n')
    console.log(`Initiating Witness Watcher`)

    let x = await essentials.get_witness_by_account(_g.client, _g.witness_data.witness)
    if (x) {
      set_initial_witness(x)

      if (IS_TESTING && _g.config.ROTATE_ROUNDS <= 0) {
        console.log('Setting KEY ROTATION to 2 for TEST MODE')
        _g.config.ROTATE_ROUNDS = 1
      }

      console.log(`Witness: ${_g.witness_data.witness} | Current Total Missed Blocks: ${_g.start_total_missed} | Threshold: ${_g.config.MISSED_BLOCKS_THRESHOLD}`)
      console.log(`TELEGRAM: ${_g.config.TELEGRAM.ENABLED ? 'ENABLED' : 'DISABLED'} | EMAIL: ${_g.config.EMAIL.ENABLED ? 'ENABLED' : 'DISABLED'} | SMS: ${_g.config.SMS.NEXMO || _g.config.SMS.TWILIO ? 'ENABLED' : 'DISABLED'}`)
      console.log(`Signing Keys: ${_g.config.SIGNING_KEYS.map(x => x.public).join(', ')}`)
      console.log(`Next Backup Key: ${_g.CURRENT_BACKUP_KEY.public !== _g.NULL_KEY ? _g.CURRENT_BACKUP_KEY.public : `No Backup Keys - Disabling Witness Directly`}`)
      console.log(`KEY ROTATION: ${_g.config.ROTATE_KEYS && _g.config.ROTATE_ROUNDS !== 0 ? `ENABLED (${_g.config.ROTATE_ROUNDS > -1 ? _g.config.ROTATE_ROUNDS : 'INFINITE'} ROUNDS)` : `DISABLED`} ${_g.config.TEST_MODE ? 'Test-Mode: ENABLED' : ''}`)
      console.log('\n----------------------------\n')
      await check_missing_env()
      essentials.log('Witness Watcher: Active\n')
      
    }
  }
}

const handle_missed_block = async (witness, IS_TESTING, NOTIFY, FAILOVER, DISABLE) => {

  // If the last missed  block is older than 1 day
  if (moment.utc().subtract(1, 'd').valueOf() >= _g.last_missed) {
    essentials.log('Last missed block is older than 1 Day')
    _g.start_total_missed = _g.current_total_missed = witness.total_missed - 1
  }

  _g.last_missed = moment.utc().valueOf()
  let missed_since_start = witness.total_missed - _g.start_total_missed

  essentials.log('[ DANGER ] Missed a Block!')

  // Send notifications if missed block should always be alerted or if the missed block threshold has been reached
  if (NOTIFY && (_g.config.ALERT_AFTER_EVERY_MISSED || missed_since_start > _g.config.MISSED_BLOCKS_THRESHOLD)) {
    send_alerts(`Missed Block!`, `Witness missed 1 Block!${missed_since_start < _g.config.MISSED_BLOCKS_THRESHOLD ? ` ${missed_since_start} more until failover.` : ''}`)
  } else {
    essentials.log(!NOTIFY ? 'TEST-MODE: Would have send notifications for missed block' : `Didn't send notification due to not reaching missed block threshold`)
  }

  // Is the current missed count >= than what the threshold is?
  if (missed_since_start >= _g.config.MISSED_BLOCKS_THRESHOLD) {

    // No Backupkey? Set key for upcoming update to null-key!
    if (!_g.CURRENT_BACKUP_KEY.public) {
      _g.CURRENT_BACKUP_KEY.public = _g.NULL_KEY
    }

    // If testing and not allow disabling of witness, then return true to exit program
    if(_g.CURRENT_BACKUP_KEY.public === _g.NULL_KEY && IS_TESTING && !DISABLE) {
      essentials.log('TEST-MODE: Would have disabled witness')
      return true
    }

    // Failover to node and choose correct tx signing key
    if (FAILOVER && (!_g.config.TEST_MODE || IS_TESTING)) {
      let transaction_key = essentials.choose_transaction_key(witness.signing_key, _g.config.ACTIVE_KEY, _g.config.SIGNING_KEYS)
      const props: any = { new_signing_key: _g.CURRENT_BACKUP_KEY.public }
      await update_witness(witness.signing_key, transaction_key, props, { set_properties: Boolean(transaction_key !== _g.config.ACTIVE_KEY) })
    } else {
      essentials.log(`TEST-MODE: Would have updated witness to ${_g.CURRENT_BACKUP_KEY.public}`)
    }

    // Send notifications
    if (NOTIFY) {
      send_alerts(`Updated Signing Key`, `Updated Signing Key to ${_g.CURRENT_BACKUP_KEY.public}`)
    } else {
      essentials.log(`TEST-MODE: Would have send notifications for updated signing key`)
    }

    _g.start_total_missed = _g.current_total_missed = witness.total_missed

    // If keys have been rotated, internal keys have to be rotated as well!
    if (_g.CURRENT_BACKUP_KEY.public !== _g.NULL_KEY) {
      update_signing_keys()
    } else if(_g.CURRENT_BACKUP_KEY.public === _g.NULL_KEY && IS_TESTING) {
      return true
    }

  } else {
    _g.current_total_missed = witness.total_missed
  }

  // Empty Line
  console.log()
}