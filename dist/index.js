"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const essentials = require("witness-essentials-package");
const helpers_1 = require("./helpers");
const _g = require('./_g');
let start = (error = false) => __awaiter(this, void 0, void 0, function* () {
    try {
        while (true) {
            yield watch_witness();
            yield essentials.timeout(_g.config.INTERVAL * 60);
        }
    }
    catch (e) {
        console.error('start', e);
        yield start(true);
    }
});
let watch_witness = () => __awaiter(this, void 0, void 0, function* () {
    try {
        yield initiate_watcher();
        let witness = yield essentials.get_witness_by_account(_g.client, _g.witness_data.witness);
        // Was witness manually disabled?
        if (witness.signing_key === _g.NULL_KEY) {
            essentials.log('Witness is disabled - skipping checking.');
            return;
        }
        else if (witness.signing_key === _g.CURRENT_BACKUP_KEY) {
            helpers_1.update_signing_keys();
        }
        // Did we miss a block?
        if (witness.total_missed > _g.current_total_missed) {
            let missed_since_start = witness.total_missed - _g.start_total_missed;
            essentials.log('[ DANGER ] Missed a Block!');
            if (_g.config.ALERT_AFTER_EVERY_MISSED || missed_since_start > _g.config.MISSED_BLOCKS_THRESHOLD) {
                helpers_1.send_alerts(`Missed Block!`, `Witness missed 1 Block!${missed_since_start < _g.config.MISSED_BLOCKS_THRESHOLD ? ` ${missed_since_start} more until failover.` : ''}`);
            }
            // Is the current missed count >= than what the threshold is?
            if (missed_since_start >= _g.config.MISSED_BLOCKS_THRESHOLD) {
                // No Backupkey? Disabling Witness!
                if (!_g.CURRENT_BACKUP_KEY)
                    _g.CURRENT_BACKUP_KEY = _g.NULL_KEY;
                if (!_g.config.TEST_MODE) {
                    yield helpers_1.update_witness(_g.CURRENT_BACKUP_KEY);
                }
                else {
                    essentials.log(`TEST-MODE: Would have updated witness to ${_g.CURRENT_BACKUP_KEY}`);
                }
                helpers_1.send_alerts(`Updated Signing Key`, `Updated Signing Key to ${_g.CURRENT_BACKUP_KEY}`);
                _g.start_total_missed = _g.current_total_missed = witness.total_missed;
                // No Backupkey? Disabling Witness!
                if (_g.CURRENT_BACKUP_KEY !== _g.NULL_KEY) {
                    helpers_1.update_signing_keys();
                }
            }
            else {
                _g.current_total_missed = witness.total_missed;
            }
        }
    }
    catch (error) {
        console.error('watch_witness', error);
        yield essentials.timeout(5);
        yield watch_witness();
    }
});
let initiate_watcher = () => __awaiter(this, void 0, void 0, function* () {
    if (_g.start_total_missed === 99999) {
        console.log('\n----------------------------\n');
        console.log('Initiating Witness Watcher');
        yield helpers_1.check_missing_env();
        let x = yield essentials.get_witness_by_account(_g.client, _g.witness_data.witness);
        if (x) {
            helpers_1.set_initial_witness(x);
            console.log(`Witness: ${_g.witness_data.witness} | Current Total Missed Blocks: ${_g.start_total_missed} | Threshold: ${_g.config.MISSED_BLOCKS_THRESHOLD}`);
            console.log(`Alerts: ${_g.config.ALERT_METHODS}`);
            console.log(`Signing Keys: ${_g.config.SIGNING_KEYS}`);
            console.log(`Next Backup Key: ${_g.CURRENT_BACKUP_KEY !== _g.NULL_KEY ? _g.CURRENT_BACKUP_KEY : `No Backup Keys - Disabling Witness Directly`}`);
            console.log(`KEY ROTATION: ${_g.config.ROTATE_KEYS ? `ENABLED (${_g.config.ROTATE_ROUNDS > -1 ? _g.config.ROTATE_ROUNDS : 'INFINITE'} ROUNDS)` : `DISABLED`} ${_g.config.TEST_MODE ? 'Test-Mode: ENABLED' : ''}`);
            console.log('\n----------------------------\n');
            essentials.log('Witness Watcher: Active\n');
        }
    }
});
start();
//# sourceMappingURL=index.js.map