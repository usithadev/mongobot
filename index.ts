import { Bot, InlineKeyboard } from "grammy";
import { config as env } from "dotenv"; env();
import mongoose from "mongoose";

mongoose.connect(process.env.DB_URI as string).then(() => {
    console.log("Connected to the database");
});

mongoose.connection.on("error", (err) => console.log(err));

interface IUser {
    name: string;
    email: string;
}

const userSchema = new mongoose.Schema<IUser>({
    name: { type: String, required: true },
    email: { type: String, required: true }
})

const User = mongoose.model("User", userSchema);

const bot = new Bot(process.env.BOT_TOKEN as string);

bot.command("start", ctx => {
    const keyboard = new InlineKeyboard()
        .url("Source code", "https://github.com/usithadev/mongbot")
        .url("Developer", "https://stackoverflow.com/users/19099302/usitha-indeewara");

    ctx.reply("Hello World! This is a simple telegram bot made for demonstrate MongoDB CRUD. \nSend /help to get how to use guide.", { reply_markup: keyboard });
});

bot.command("help", ctx => {
    ctx.reply("Commands:\n\n`/start` - Start the bot \n`/help` - Show this message \n`/save username example@email.com` - Save a new record \n`/delete example@email.com` - Delete a record \n`/getall` - See all data in the database",
        {
            parse_mode: "Markdown"
        });
})

bot.command("save", async ctx => {
    const item: string = ctx.match;
    if (item.match(/(\w+) (\w*@\w+\.\w+)/gi)) {
        const newuser = new User({
            name: item.split(" ")[0],
            email: item.split(" ")[1]
        });

        await newuser.save();

        ctx.reply("Saved!");
    } else {
        ctx.reply("Invalid format\\! Please send in the format `/save username username@example\.com`", { parse_mode: "MarkdownV2" });
    }
});

bot.command("delete", async ctx => {
    const item: string = ctx.match;
    if (item.match(/(\w*@\w+\.\w+)/gi)) {
        const del = await User.deleteMany({ email: item });
        ctx.reply(`Deleted ${item} successfully.`)
    } else {
        ctx.reply("Invalid format\\. Please use format `/delete example@example\.com`", { parse_mode: "MarkdownV2" });
    }
})

bot.command("getall", async ctx => {
    const data = await User.find();
    let str: string = "";
    data.forEach(val => {
        str += val.name + " :- " + val.email + "\n";
    });

    ctx.reply(str);
});



bot.start();
console.log("Bot (may be) started");

process.on("SIGINT", () => {
    mongoose.disconnect().then(() => {
        console.log("Disconnected the database");

        process.exit(0);
    })
})