"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dsteem = require("dsteem-hf20");
exports.NULL_KEY = 'STM1111111111111111111111111111111114T1Anm';
exports.CURRENT_SIGNING_KEY = '';
exports.ORIG_KEY = '';
exports.TRANSACTION_SIGNING_KEY = '';
exports.USED_SIGNING_KEYS = [];
exports.CURRENT_BACKUP_KEY = { public: 'STM1111111111111111111111111111111114T1Anm', private: '' };
exports.rotation_round = 0;
exports.start_total_missed = 99999;
exports.current_total_missed = 99999;
exports.config = require('../configs/config.js').get();
exports.current_node = exports.config.RPC_NODES[0];
exports.client = new dsteem.Client(exports.current_node, { timeout: 8 * 1000 });
exports.witness_data = {
    witness: exports.config.WITNESS,
    props: { account_creation_fee: '3.000 STEEM', maximum_block_size: 65536, sbd_interest_rate: 0 },
    url: ''
};
exports.telegram_data = {
    bot_token: exports.config.TELEGRAM.BOT_TOKEN,
    user_id: exports.config.TELEGRAM.USER_ID
};
exports.mail_data = {
    mail_account: exports.config.EMAIL.GOOGLE_MAIL_ACCOUNT,
    mail_password: exports.config.EMAIL.GOOGLE_MAIL_PASSWORD,
    to: exports.config.EMAIL.EMAIL_RECEIVER
};
exports.provider_data = {
    api_key: exports.config.SMS.API_KEY,
    api_secret: exports.config.SMS.API_SECRET,
    phone_number: exports.config.SMS.PHONE_NUMBER,
    from_number: exports.config.SMS.FROM_NUMBER
};
//# sourceMappingURL=_g.js.map