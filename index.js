const qrcode = require('qrcode-terminal');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');

const client = new Client({authStrategy: new LocalAuth()});

client.on('qr', (qr) => {
	qrcode.generate(qr, {small: true})
});

client.on('ready', () => {
	console.log('Client is ready!');
});

client.on('message', async (message) => {
	if (message.body.includes('ironman')) {
		const media = MessageMedia.fromUrl('https://images.hindustantimes.com/rf/image_size_630x354/HT/p2/2018/08/06/Pictures/_613c5702-994e-11e8-9ea4-7619ca404631.jpg')
		return message.getChat().then(chat => chat.sendMessage(media))
	}
})

client.initialize();