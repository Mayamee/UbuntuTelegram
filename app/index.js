const { Telegraf, Telegram } = require("telegraf");
const dotenv = require("dotenv");
const { resolve } = require("path");
const { spawn, exec, spawnSync } = require("child_process");
const { EventEmitter } = require("events");
const { splitByCounter, preprocessCMD } = require("./lib/helpers");
dotenv.config({ path: resolve(process.cwd(), "..", ".env") });
const CHAT = process.env.CHAT;
const TOKEN = process.env.TOKEN;
const ESender = new EventEmitter({});

let cmd = null;
const telegram = new Telegram(TOKEN, {});
const bot = new Telegraf(TOKEN, {});

ESender.on("packet_delivered", async (packetArr) => {
  if (packetArr.length)
    for (const message of packetArr) {
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          await telegram.sendMessage(CHAT, message);
          break;
        } catch (error) {
          console.error(error);
          await ((ms) => new Promise((r) => setTimeout(r, ms)))(5000);
        }
      }
    }
  console.log("Message sended");
});
ESender.on("exit", (code) => {
  telegram.sendMessage(CHAT, `Child exited with code ${code}`);
});
bot.use(async (ctx, next) => {
  const message = ctx.message?.text || "";
  const username = ctx.chat.username;
  console.info({ username, message });
  await next();
});

bot.start(async (ctx) => {
  cmd = spawn("wsl.exe", {});
  //ondata
  cmd.stdout.on("data", (data) => {
    const _data = data.toString().trim();
    if (_data) {
      const packetArr = splitByCounter(_data, 4096);
      ESender.emit("packet_delivered", packetArr);
    }
  });
  //onerr
  cmd.stderr.on("data", (data) => {
    const _data = data.toString().trim();
    if (_data) {
      const packetArr = splitByCounter(_data, 4096);
      ESender.emit("packet_delivered", packetArr);
    }
  });

  cmd.on("exit", async (code) => {
    ESender.emit("exit", code);
  });
  await ctx.telegram.sendMessage(CHAT, "CMD started...");
});
bot.command("stop", async (ctx) => {
  await cmd.kill();
  cmd = null;
  await ctx.reply("CMD is stopped...");
});

bot.on("message", async (ctx) => {
  if (cmd) {
    const cmdMessage = preprocessCMD(ctx.message.text);
    await cmd.stdin.write(cmdMessage + "\n", (err) => {
      if (err) console.error(err);
    });
  }
});

bot.catch((err, ctx) => {
  console.error(err);
});
bot.launch({}).then((v) => {
  console.info("Bot has been started");
});
