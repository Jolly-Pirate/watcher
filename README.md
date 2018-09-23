# Watcher

Script for Steem Witnesses that watches over your witness, alerts you (TELEGRAM, SMS, MAIL) in case of missed blocks and switches (rotates between) keys. Including RPC-failover and robust error handling.

## Installation


1.) Clone Repository and install packages
```
git clone https://github.com/witness-essentials/watcher.git
cd watcher
npm i # or yarn
```

2.) Edit your Config
```
cp configs/config.example.json configs/config.json
nano configs/config.json
```

#### Config Explanation

- TEST_MODE: It will alert you in case of missed blocks, but without actually changing signing keys
- MISSED_BLOCKS_THRESHOLD: How many blocks can be missed until signing key gets changed / or disabled.
- ROTATE_KEYS: The script can rotate between your signing keys, until ROTATE_ROUNDS has been reached (-1 is infinite)
- SIGNING_KEYS: Add **all** your signing keys here, even your current active one. For example `["STM5SGLJSD...", "STM7JGIDOAL..."]`

The rest should be self-explanatory

---

3.) Edit your ENV file (sensitive data)
```
touch .env
nano .env

# Add the following lines inside (you can leave variables empty if you don't need them)
ACTIVE_KEY=
API_KEY=
API_SECRET=
PHONE_NUMBER=
FROM_NUMBER=
GOOGLE_MAIL_ACCOUNT=
GOOGLE_MAIL_PASSWORD=
MAIL_TO=
TELEGRAM_BOT_TOKEN=
TELEGRAM_USER_ID=
```

#### .ENV Explanation

- API_KEY: NEXMO or TWILIO API KEY for SMS alerts
- API_SECRET: NEXMO or TWILIO API SECRET for SMS alerts
- PHONE_NUMBER: For NEXMO or TWILIO - incl. country-code: e.g. 49123456789 (+49 would be Germany)
- FROM_NUMBER: Only for TWILIO
- GOOGLE_MAIL_ACCOUNT: Authentication for Email sending
- GOOGLE_MAIL_PASSWORD: Authentication for Email sending
- MAIL_TO: Mail account that should receive the emails
- TELEGRAM_BOT_TOKEN: The token you'll get from botfather
- TELEGRAM_USER_ID: You'll get the ID once you've created your bot and pressed on start or entered /help

To get the TELEGRAM data, follow this guide: https://core.telegram.org/bots#6-botfather

---

## Start

You can either run it directly with `npm start` or by using PM2 (my favourite).

```
sudo npm install pm2 -g # if you haven't installed it yet

pm2 start npm --name=watcher -- start
pm2 save
pm2 logs watcher
```

## Support

If you find this tool useful, consider voting for me (@therealwolf) as a witness (https://steemit.com/~witnesses) or <a href="https://v2.steemconnect.com/sign/account-witness-vote?witness=therealwolf&approve=1">directly with steemconnect</a>.
