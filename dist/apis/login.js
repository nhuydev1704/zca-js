import { appContext } from "../context.js";
import { Zalo } from "../index.js";
import { decryptResp, getSignKey, makeURL, ParamsEncryptor, request } from "../utils.js";
export async function login(encryptParams) {
    const encryptedParams = await getEncryptParam(appContext.imei, appContext.language, encryptParams, "getlogininfo");
    console.log("url", makeURL("https://wpa.chat.zalo.me/api/login/getLoginInfo", Object.assign(Object.assign({}, encryptedParams.params), { nretry: 0 })));
    try {
        const response = await request("https://wpa.chat.zalo.me/api/login/getLoginInfo?zcid=841B0C24BF01AFD93AA13A053E156402DEC156CE9160F8A23570E6144BD4F25827F28E77ADF9CD4DB06CBCAFC6B71DB1E9D6BD4D87113C3AFF696B2CD43C87290CBAF26B1E959FB5E943250468F3D84D95D511BA4EA282560ACB4E87127401D8&zcid_ext=e92e12d318&enc_ver=v2&params=RE5e5GIq%2BtIN1YwCesvVp4PXzOi0N1jl5mWExaV7pr61TiTqwstDFZxWAsmOrbpokj3hqNRZ6u5g9UCqdITBJIOpY17Yxoi17qUu6U6%2FAGZafK3FVBcvzuekrJrca4lS2FZQ0dbVYZ9K9ss%2BlDyW7GyNLLJj17mI%2BSdzwY0QSRhLWI3genbFM0IJQHh2NOTi&type=30&client_version=612&signkey=43d091dc98e57e32ec66419d187f6830&nretry=0");
        console.log("response", response);
        if (!response.ok)
            throw new Error("Failed to fetch login info: " + response.statusText);
        const data = await response.json();
        if (encryptedParams.enk) {
            const decryptedData = decryptResp(encryptedParams.enk, data.data);
            return decryptedData != null && typeof decryptedData != "string" ? decryptedData : null;
        }
        return null;
    }
    catch (error) {
        console.error(error);
        throw new Error("Failed to fetch login info: " + error);
    }
}
export async function getServerInfo(encryptParams) {
    const encryptedParams = await getEncryptParam(appContext.imei, appContext.language, encryptParams, "getserverinfo");
    try {
        const response = await request(makeURL("https://wpa.chat.zalo.me/api/login/getServerInfo", {
            imei: appContext.imei,
            type: Zalo.API_TYPE,
            client_version: Zalo.API_VERSION,
            computer_name: "Web",
            signkey: encryptedParams.params.signkey,
        }));
        if (!response.ok)
            throw new Error("Failed to fetch server info: " + response.statusText);
        const data = await response.json();
        if (data.data == null)
            throw new Error("Failed to fetch server info: " + data.error);
        return data.data;
    }
    catch (error) {
        console.error(error);
        throw new Error("Failed to fetch server info: " + error);
    }
}
async function getEncryptParam(imei, language, encryptParams, type) {
    const params = {};
    const data = {
        computer_name: "Web",
        imei,
        language,
        ts: Date.now(),
    };
    const encryptedData = await _encryptParam(data, encryptParams);
    if (encryptedData == null)
        Object.assign(params, data);
    else {
        const { encrypted_params, encrypted_data } = encryptedData;
        Object.assign(params, encrypted_params);
        params.params = encrypted_data;
    }
    params.type = Zalo.API_TYPE;
    params.client_version = Zalo.API_VERSION;
    params.signkey =
        type == "getserverinfo"
            ? getSignKey(type, {
                imei: appContext.imei,
                type: Zalo.API_TYPE,
                client_version: Zalo.API_VERSION,
                computer_name: "Web",
            })
            : getSignKey(type, params);
    return {
        params,
        enk: encryptedData ? encryptedData.enk : null,
    };
}
async function _encryptParam(data, encryptParams) {
    if (encryptParams) {
        const encryptor = new ParamsEncryptor({
            type: Zalo.API_TYPE,
            imei: data.imei,
            firstLaunchTime: Date.now(),
        });
        try {
            const stringifiedData = JSON.stringify(data);
            const encryptedKey = encryptor.getEncryptKey();
            const encodedData = ParamsEncryptor.encodeAES(encryptedKey, stringifiedData, "base64", false);
            const params = encryptor.getParams();
            return params
                ? {
                    encrypted_data: encodedData,
                    encrypted_params: params,
                    enk: encryptedKey,
                }
                : null;
        }
        catch (error) {
            throw new Error("Failed to encrypt params: " + error);
        }
    }
    return null;
}
