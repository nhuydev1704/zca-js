import { Zalo } from "../src/index.js";
const zalo = new Zalo({
    cookie: "",
    imei: "",
    userAgent: "",
    language: "vi",
});

const api = await zalo.login();
const listener = new api.Listener({ selfListen: true });

listener.onConnected(() => {
    console.log("Connected");
});

listener.onClosed(() => {
    console.log("Closed");
});

listener.onError((error: any) => {
    console.error("Error:", error);
});

listener.onMessage((message) => {
    console.log("Message:", message.data.toJSON());
    switch (message.type) {
        case "message":
            api.addReaction(":>", message.data).then(console.log);
            if (message.data.owner != api.getOwnId()) {
                switch (message.data.msg) {
                    case "reply": {
                        api.sendMessage("reply", message.data.owner, message.data).then(
                            console.log
                        );
                        break;
                    }
                    case "ping": {
                        api.sendMessage("pong", message.data.owner).then(console.log);
                        break;
                    }
                    default: {
                        const args = message.data.msg.split(/\s+/);
                        if (args[0] == "sticker" && args[1]) {
                            api.getStickers(args[1]).then((stickers) => {
                                const { sticker } = stickers.suggestions;
                                const random = sticker[Math.floor(Math.random() * sticker.length)];
                                console.log("Sending sticker:", random);

                                if (random)
                                    api.sendSticker(random, message.data.owner).then(console.log);
                                else
                                    api.sendMessage("No sticker found", message.data.owner).then(
                                        console.log
                                    );
                            });
                        }
                        break;
                    }
                }
            }
            break;

        case "group_message":
            break;

        default:
            break;
    }
});

listener.start();
