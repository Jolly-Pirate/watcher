"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dsteem = require("dsteem");
exports.NULL_KEY = 'STM1111111111111111111111111111111114T1Anm';
exports.ORIG_KEY = '';
exports.ACTIVE_KEY = '';
exports.USED_SIGNING_KEYS = [];
exports.CURRENT_BACKUP_KEY = '';
exports.rotation_round = 0;
exports.start_total_missed = 99999;
exports.current_total_missed = 99999;
exports.config = require('../configs/config.js').get();
exports.current_node = exports.config.RPC_NODES[0];
exports.client = new dsteem.Client(exports.current_node, { timeout: 8 * 1000 });
exports.witness_data = {
    witness: exports.config.WITNESS,
    props: exports.config.PROPS || { account_creation_fee: '0.100 STEEM', maximum_block_size: 65536, sbd_interest_rate: 0 },
    url: 'https://steemit.com'
};
exports.telegram_data = {
    bot_token: process.env.TELEGRAM_BOT_TOKEN,
    user_id: process.env.TELEGRAM_USER_ID
};
exports.mail_data = {
    mail_account: process.env.GOOGLE_MAIL_ACCOUNT,
    mail_password: process.env.GOOGLE_MAIL_PASSWORD,
    to: process.env.EMAIL_TO
};
exports.provider_data = {
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
    phone_number: process.env.PHONE_NUMBER,
    from_number: process.env.FROM_NUMBER
};
//# sourceMappingURL=_g.js.map