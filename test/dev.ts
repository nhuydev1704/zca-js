import { Credentials, Zalo } from "../src";

const zalo = new Zalo({
    selfListen: true,
    logging: true,
});

let loginData: Credentials = {
    imei: "",
    cookie: [],
    userAgent: "",
};

const login = async () => {
    const api = await zalo.onlyLoginQr({}, (res) => {
        console.log("Login QR Callback", res);
        if (res.type === 4) {
            loginData = res.data;
        }
    });

    return api;
};

const app = async () => {
    await login();
    const reLogin = await zalo.login(loginData);

    console.log("reLogin", reLogin.getOwnId());
};

app().catch((err) => {
    console.error("Error:", err);
});
