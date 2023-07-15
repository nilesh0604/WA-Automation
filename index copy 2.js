const qrcode = require('qrcode-terminal');
const fs = require('fs');
const { Client, LocalAuth } = require('whatsapp-web.js');

const sessions = [];
const SESSIONS_FILE = './whatsapp-sessions.json';

const createSessionsFileIfNotExists = function () {
	if (!fs.existsSync(SESSIONS_FILE)) {
		try {
			fs.writeFileSync(SESSIONS_FILE, JSON.stringify([]));
			console.log('Sessions file created successfully.');
		} catch (err) {
			console.log('Failed to create sessions file: ', err);
		}
	}
};

createSessionsFileIfNotExists();

const setSessionsFile = function (sessions) {
	fs.writeFile(SESSIONS_FILE, JSON.stringify(sessions), function (err) {
		if (err) {
			console.log(err);
		}
	});
};

const getSessionsFile = function () {
	try {
		const data = fs.readFileSync(SESSIONS_FILE);
		return JSON.parse(data);
	} catch (err) {
		console.log('Error reading sessions file:', err);
		return [];
	}
};

const removeSession = function (client, id) {
	console.log('Auth failure, restarting...');
	client.destroy();
	client.initialize();

	// Menghapus pada file sessions
	const savedSessions = getSessionsFile();
	console.log('savedSessions', savedSessions);
	const sessionIndex = savedSessions.findIndex((sess) => sess.id == id);
	console.log('sessionIndex', sessionIndex);
	savedSessions.splice(sessionIndex, 1);
	console.log('savedSessions', savedSessions);
	setSessionsFile(savedSessions);

	console.log('remove-session', id);
};

let client;

const createSession = function (id, description) {
	console.log('Creating session: ' + id);
	client = new Client({
		restartOnAuthFail: true,
		puppeteer: {
			headless: true,
			args: [
				'--no-sandbox',
				'--disable-setuid-sandbox',
				'--disable-dev-shm-usage',
				'--disable-accelerated-2d-canvas',
				'--no-first-run',
				'--no-zygote',
				'--single-process', // <- this one doesn't works in Windows
				'--disable-gpu',
			],
		},
		authStrategy: new LocalAuth({
			clientId: id,
		}),
	});

	client.initialize();

	client.on('qr', (qr) => {
		console.log('QR RECEIVED', qr);
		qrcode.generate(qr, { small: true });
	});

	client.on('ready', () => {
		console.log('Whatsapp is ready!');

		const savedSessions = getSessionsFile();
		const sessionIndex = savedSessions.findIndex((sess) => sess.id == id);
		savedSessions[sessionIndex].ready = true;
		setSessionsFile(savedSessions);
		client.getChats().then((chats) => {
			console.log(chats[0]);
		});
	});

	client.on('authenticated', () => {
		console.log('Whatsapp is authenticated!');
	});

	client.on('auth_failure', function () {
		console.log('message', { id: id, text: 'Auth failure, restarting...' });
	});

	client.on('disconnected', (reason) => {
		removeSession(client, 123);
	});

	// Tambahkan client ke sessions
	sessions.push({
		id: id,
		description: description,
		client: client,
	});

	// Menambahkan session ke file
	const savedSessions = getSessionsFile();
	const sessionIndex = savedSessions.findIndex((sess) => sess.id == id);

	if (sessionIndex == -1) {
		savedSessions.push({
			id: id,
			description: description,
			ready: false,
		});
		setSessionsFile(savedSessions);
	}
};

const init = function () {
	const savedSessions = getSessionsFile();

	if (savedSessions.length > 0) {
		savedSessions.forEach((sess) => {
			createSession(sess.id, sess.description);
		});
	}
};

// process.on('exit', function (code) {
// 	if (code === 130) {
// 		removeSession(client, 123);
// 	}
// 	return console.log(`Process to exit with code ${code}`);
// });

init();
