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
const essentials = require("witness-essentials-package");
const dsteem = require("dsteem");
const _g = require('./_g');
const config = _g.config;
exports.update_witness = (key, retries = 0) => __awaiter(this, void 0, void 0, function* () {
    try {
        yield essentials.update_witness(_g.client, key, _g.witness_data, process.env.ACTIVE_KEY);
    }
    catch (error) {
        console.error(error);
        if (retries < 2) {
            yield essentials.timeout(1);
            yield exports.update_witness(key, retries += 1);
        }
        else {
            exports.failover();
            yield exports.update_witness(key, 0);
        }
    }
});
exports.get_witness = (retries = 0) => __awaiter(this, void 0, void 0, function* () {
    try {
        return yield essentials.get_witness_by_account(_g.client, _g.witness_data.witness);
    }
    catch (error) {
        console.error(error);
        if (retries < 2) {
            yield essentials.timeout(1);
            yield exports.get_witness(retries += 1);
        }
        else {
            exports.failover();
            yield exports.get_witness(0);
        }
    }
});
/**
 * Send all selected alert methods inside the config
 * @param force Whther sending should be forced
 */
exports.send_alerts = (subject, message, force = false) => __awaiter(this, void 0, void 0, function* () {
    try {
        for (let alert_method of config.ALERT_METHODS) {
            if (alert_method === 'SMS') {
                essentials.log(`Sending SMS: ${subject}`);
                essentials.send_sms(`Witness Watcher: ${subject}`, message, config.SMS_PROVIDER, _g.provider_data);
            }
            else if (alert_method === 'EMAIL') {
                essentials.log(`Sending Email: ${subject}`);
                essentials.send_email(`Witness Watcher: ${subject}`, message, _g.mail_data);
            }
            else if (alert_method === 'TELEGRAM') {
                essentials.log(`Sending Telegram: ${subject}`);
                essentials.send_telegram(message, _g.telegram_data);
            }
        }
    }
    catch (error) {
        console.error('send_alert', error);
    }
});
exports.failover = () => __awaiter(this, void 0, void 0, function* () {
    _g.current_node = essentials.failover_node(_g.config.RPC_NODES, _g.current_node);
    essentials.log(`Switched Node: ${_g.current_node}`);
    _g.client = new dsteem.Client(_g.current_node, { timeout: 8 * 1000 });
});
/**
 * Rotate through signing-keys, customized for witness-watcher. Remote uses a simpler version.
 */
exports.update_signing_keys = () => {
    _g.USED_SIGNING_KEYS.push(_g.CURRENT_BACKUP_KEY);
    let index = _g.config.SIGNING_KEYS.indexOf(_g.CURRENT_BACKUP_KEY);
    if (index >= (_g.config.SIGNING_KEYS.length - 1)) {
        if (_g.config.ROTATE_KEYS && (_g.config.ROTATE_ROUNDS > _g.rotation_round || _g.config.ROTATE_ROUNDS === -1)) {
            _g.USED_SIGNING_KEYS = [];
            _g.CURRENT_BACKUP_KEY = _g.config.SIGNING_KEYS[0];
            _g.rotation_round += 1;
        }
        else {
            _g.CURRENT_BACKUP_KEY = _g.NULL_KEY;
        }
    }
    else {
        _g.CURRENT_BACKUP_KEY = _g.config.SIGNING_KEYS[index + 1];
    }
};
exports.set_initial_witness = (x) => {
    _g.start_total_missed = x.total_missed;
    _g.current_total_missed = _g.start_total_missed;
    _g.witness_data.url = x.url;
    _g.witness_data.props = x.props;
    _g.config.SIGNING_KEYS = essentials.order_keys(_g.config.SIGNING_KEYS, x.signing_key);
    _g.USED_SIGNING_KEYS = [x.signing_key];
    _g.CURRENT_BACKUP_KEY = essentials.get_next_key(_g.config.SIGNING_KEYS, x.signing_key, true);
};
exports.check_missing_env = () => __awaiter(this, void 0, void 0, function* () {
    try {
        console.log('Checking .env & config');
        let env_missing = [];
        if (!process.env.ACTIVE_KEY)
            env_missing.push('ACTIVE_KEY');
        if (env_missing.length > 0) {
            if (env_missing.length > 0)
                essentials.log(`Missing .env variables: ${env_missing}`);
            process.exit(-1);
        }
        console.log('Check was successful!');
        console.log('\n' + '----------------------------' + '\n');
    }
    catch (e) {
        console.error('check_missing_variables', e);
        essentials.log(`Exiting Process.`);
        process.exit(-1);
    }
});
//# sourceMappingURL=helpers.js.map