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
  const respondedUsers = new Set();

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

    const namaGrup = `*Metroneusantara*`;
    const commandChat = `*_1_*`;

    const start = `Halo Selamat datang di komunitas ${namaGrup}. komunitas yang bergerak dibidang layanan jasa dan siap membantu mempermudah segala perkerjaanmu!!\n\nDisini kami menyediakan beberapa layanan jasa,Diantaranya :\n\n1.Graphic designer(Poster,Banner,dll.)
2.PowerPoint Designer
3.Infografis designer
4.E-Book
5.Web Development
6.Web design\n
Untuk melihat contoh nyata dari produk kami boleh langsung mengunjungi beberapa laman situs dibawah ini:\n
Website : https://lynk.id/metroneusantara
Instagram : https://www.instagram.com/metroneusantara?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==
TikTok : https://www.tiktok.com/@metroneu.digital?_t=8ovxuO1nD3I&_r=1\n
Jika ingin me-request desain yg ingin dibuat tanpa biaya tambahan silahkan hubungi nomor dibawah ini
wa : +62 851-4232-2487 atau _klik link dibawah ini_
link : https://wa.me/6285142322487?text=Halo,%20saya%20ingin%20bertanya%20mengenai%20produk
\n
Terimahkasih telah menghubungi Metroneusantara
Have a Nice day
`;

    const response = `Hi Kak, Mohon menunggu sebentar, salah satu rekan Team Support Metroneusantara akan segera membalas pesan anda 😊\n\nPENTING:
> Follow IG ☞ https://www.instagram.com/metroneusantara?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==
> Follow TikTok ☞ https://www.tiktok.com/@metroneu.digital?_t=8ovxuO1nD3I&_r=1
> kunjungi laman web  ☞ https://lynk.id/metroneusantara
Have a Nice Day 😇.
`;

    if (!greetedUsers.has(remoteJid)) {
      // Kirim pesan sambutan
      await socket.sendMessage(remoteJid, {
        text: start,
      });

      // Tandai pengguna sebagai sudah menerima pesan pertama
      greetedUsers.add(remoteJid);
    } else if (!respondedUsers.has(remoteJid)) {
      // Kirim pesan kedua hanya jika pesan pertama sudah dikirim dan pesan kedua belum dikirim
      await socket.sendMessage(remoteJid, { text: response });

      // Tandai pengguna sebagai sudah menerima pesan kedua
      respondedUsers.add(remoteJid);
    }

    switch (command) {
      case "1":
        await socket.sendMessage(chat.key.remoteJid, { text: response });
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
