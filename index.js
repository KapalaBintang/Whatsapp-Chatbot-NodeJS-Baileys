const { makeWASocket, useMultiFileAuthState, downloadContentFromMessage } = require("@whiskeysockets/baileys");
const pino = require("pino");
require("dotenv").config();
const { createSticker, StickerTypes } = require("wa-sticker-formatter");

async function connectWhatsapp() {
  const auth = await useMultiFileAuthState("session");
  const socket = makeWASocket({
    printQRInTerminal: true,
    browser: ["KAPALABINTANG", "", ""],
    auth: auth.state,
    logger: pino({ level: "silent" }),
  });

  const greetedUsers = new Set();

  socket.ev.on("creds.update", auth.saveCreds);
  socket.ev.on("connection.update", async ({ connection }) => {
    if (connection === "open") {
      console.log("BOT WHATSAPP SUDAH SIAP✅ -- BY KAPALA BINTANG");
    } else if (connection === "close") {
      await connectWhatsapp();
    }
  });

  socket.ev.on("messages.upsert", async ({ messages, type }) => {
    if (messages[0].key.fromMe) return;
    const chat = messages[0];
    const remoteJid = chat.key.remoteJid;
    const pesan = (chat.message?.extendedTextMessage?.text ?? chat.message?.ephemeralMessage?.message?.extendedTextMessage?.text ?? chat.message?.conversation)?.toLowerCase() || "";
    const command = pesan.split(" ")[0];

    const start = "Selamat datang, ini beberapa perintah yang dapat membantumu:\n1. .produk: untuk melihat produk digital kami.\n2. .sticker: mengubah gambar yang kamu kirim menjadi stiker";

    const halo = `Selamat datang, apa yang Anda butuhkan?\n1. Produk digital: Anda dapat mengunjungi https://www.instagram.com/metroneusantara/ untuk melihat produk digital kami.\n2. Cara memesan: Hubungi ${process.env.PHONE_NUMBER} untuk memesan produk digital kami.`;

    if (!greetedUsers.has(remoteJid)) {
      // Kirim pesan sambutan
      await socket.sendMessage(remoteJid, {
        text: start,
      });

      // Tandai pengguna sebagai sudah menerima pesan
      greetedUsers.add(remoteJid);
    }

    switch (command) {
      case ".produk":
        await socket.sendMessage(chat.key.remoteJid, { text: halo });
        break;

      case ".h":
      case ".hidetag":
        const args = pesan.split(" ").slice(1).join(" ");

        if (!chat.key.remoteJid.includes("@g.us")) {
          await socket.sendMessage(chat.key.remoteJid, { text: "*Command ini hanya bisa di gunakan di grub!!*" }, { quoted: chat });
          return;
        }

        const metadata = await socket.groupMetadata(chat.key.remoteJid);
        const participants = metadata.participants.map((v) => v.id);

        socket.sendMessage(chat.key.remoteJid, {
          text: args,
          mentions: participants,
        });

        break;
    }

    if (chat.message?.imageMessage?.caption == ".sticker" && chat.message?.imageMessage) {
      const getMedia = async (msg) => {
        const messageType = Object.keys(msg?.message)[0];
        const stream = await downloadContentFromMessage(msg.message[messageType], messageType.replace("Message", ""));
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
          buffer = Buffer.concat([buffer, chunk]);
        }

        return buffer;
      };

      const mediaData = await getMedia(chat);
      const stickerOption = {
        pack: "KapalaBintang",
        author: "Kapala Bintang",
        type: StickerTypes.FULL,
        quality: 50,
      };

      const generateSticker = await createSticker(mediaData, stickerOption);
      await socket.sendMessage(chat.key.remoteJid, { sticker: generateSticker }); //langsung cobaaa
    }
  });
}

connectWhatsapp();
