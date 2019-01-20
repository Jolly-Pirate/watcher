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
const _g = require("./_g");
const config = _g.config;
exports.update_witness = (current_signing_key, transaction_signing_key, props, options = {}) => __awaiter(this, void 0, void 0, function* () {
    try {
        if (!options.retries)
            options.retries = 0;
        if (options.set_properties) {
            yield essentials.witness_set_properties(_g.client, _g.witness_data.witness, current_signing_key, props, transaction_signing_key);
        }
        else {
            yield essentials.update_witness(_g.client, props.new_signing_key.toString(), _g.witness_data, transaction_signing_key);
        }
    }
    catch (error) {
        console.error(error);
        if (options.retries < 2) {
            yield essentials.timeout(1);
            options.retries += 1;
            yield exports.update_witness(current_signing_key, transaction_signing_key, props, options);
        }
        else {
            exports.failover();
            options.retries = 0;
            yield exports.update_witness(current_signing_key, transaction_signing_key, props, options);
        }
    }
});
exports.get_witness = (options = { retries: 0 }) => __awaiter(this, void 0, void 0, function* () {
    try {
        if (!options.retries)
            options.retries = 0;
        let witness = yield essentials.get_witness_by_account(_g.client, _g.witness_data.witness);
        return witness;
    }
    catch (error) {
        console.error(error);
        if (options.retries < 2) {
            yield essentials.timeout(1);
            options.retries += 1;
            yield exports.get_witness(options);
        }
        else {
            exports.failover();
            options.retries = 0;
            yield exports.get_witness(options);
        }
    }
});
/**
 * Send all selected alert methods inside the config
 * @param force Whther sending should be forced
 */
exports.send_alerts = (subject, message, force = false) => __awaiter(this, void 0, void 0, function* () {
    try {
        if (config.SMS.NEXMO || config.SMS.TWILIO) {
            essentials.log(`Sending SMS: ${subject}`);
            essentials.send_sms(`Witness Watcher: ${subject}`, message, config.SMS_PROVIDER, _g.provider_data);
        }
        if (config.EMAIL.ENABLED) {
            essentials.log(`Sending Email: ${subject}`);
            essentials.send_email(`Witness Watcher: ${subject}`, message, _g.mail_data);
        }
        if (config.TELEGRAM.ENABLED) {
            essentials.log(`Sending Telegram: ${subject}`);
            essentials.send_telegram(message, _g.telegram_data);
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
    _g.USED_SIGNING_KEYS.push(_g.CURRENT_BACKUP_KEY.public);
    let index = _g.config.SIGNING_KEYS.indexOf(_g.CURRENT_BACKUP_KEY);
    if (index >= (_g.config.SIGNING_KEYS.length - 1)) {
        if (_g.config.ROTATE_KEYS && (_g.config.ROTATE_ROUNDS > _g.rotation_round || _g.config.ROTATE_ROUNDS === -1)) {
            _g.USED_SIGNING_KEYS = [];
            _g.CURRENT_BACKUP_KEY = _g.config.SIGNING_KEYS[0];
            _g.rotation_round += 1;
        }
        else {
            _g.CURRENT_BACKUP_KEY = { public: _g.NULL_KEY, private: '' };
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
    if (_g.config.SIGNING_KEYS.filter(y => y.public === x.signing_key).length <= 0) {
        _g.config.SIGNING_KEYS.push({ public: x.signing_key, private: '' });
    }
    _g.config.SIGNING_KEYS = essentials.order_keys(_g.config.SIGNING_KEYS, x.signing_key);
    _g.USED_SIGNING_KEYS = [x.signing_key];
    _g.CURRENT_BACKUP_KEY = essentials.get_next_key(_g.config.SIGNING_KEYS, x.signing_key, true);
};
exports.set_transaction_signing_key = () => {
    _g.TRANSACTION_SIGNING_KEY = '';
};
exports.check_missing_env = () => __awaiter(this, void 0, void 0, function* () {
    try {
        console.log('Checking config');
        const missing = [];
        if (_g.config.SIGNING_KEYS.filter(x => x.private === '').length > 0 && !_g.config.ACTIVE_KEY) {
            console.log(`Missing private signing-keys or private active-key. If you don't want to use the private active key, make sure to add all your signing-keys (including your active one) with the correct private signing-key.`);
        }
        if (_g.config.SMS.NEXMO || _g.config.SMS.TWILIO) {
            let sms = _g.config.SMS;
            if (!sms.API_KEY)
                missing.push('SMS > API_KEY');
            if (!sms.API_SECRET)
                missing.push('SMS > API_SECRET');
            if (!sms.PHONE_NUMBER)
                missing.push('SMS > PHONE_NUMBER');
            if (sms.TWILIO && !sms.FROM_NUMBER)
                missing.push('SMS > FROM_NUMBER');
        }
        if (_g.config.EMAIL.ENABLED) {
            let email = _g.config.EMAIL;
            if (!email.GOOGLE_MAIL_ACCOUNT)
                missing.push('EMAIL > GOOGLE_MAIL_ACCOUNT');
            if (!email.GOOGLE_MAIL_PASSWORD)
                missing.push('EMAIL > GOOGLE_MAIL_PASSWORD');
            if (!email.EMAIL_RECEIVER)
                missing.push('EMAIL > EMAIL_RECEIVER');
        }
        if (_g.config.TELEGRAM.ENABLED) {
            let telegram = _g.config.TELEGRAM;
            if (!telegram.BOT_TOKEN)
                missing.push('TELEGRAM > BOT_TOKEN');
            if (!telegram.USER_ID)
                missing.push('TELEGRAM > USER_ID');
        }
        if (missing.length > 0) {
            if (missing.length > 0)
                essentials.log(`Missing config variables: ${missing}`);
            process.exit();
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