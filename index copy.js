const qrcode = require('qrcode-terminal');
const fs = require('fs');
const { Client, LegacySessionAuth } = require('whatsapp-web.js');
// const client = new Client();

// Path where the session data will be stored
const SESSION_FILE_PATH = './session.json';

// Load the session data if it has been previously saved
let sessionData;
if (fs.existsSync(SESSION_FILE_PATH)) {
	sessionData = require(SESSION_FILE_PATH);
}

// Use the saved values
const client = new Client({
	authStrategy: new LegacySessionAuth({
		session: sessionData,
	}),
});

client.on('qr', (qr) => {
	qrcode.generate(qr, { small: true });
});

// Save session values to the file upon successful auth
client.on('authenticated', (session) => {
	sessionData = session;
	fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), (err) => {
		if (err) {
			console.error(err);
		}
	});
});

client.on('ready', () => {
	console.log('Client is ready!');
	client.getChats().then((chats) => {
		console.log(chats[0]);
	});
});

client.initialize();

// [{"id":123,"description":"Nilesh","ready":true}]
