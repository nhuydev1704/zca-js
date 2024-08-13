import { appContext } from "../context.js";
import { Message } from "../models/Message.js";
import { decodeAES, encodeAES, request } from "../utils.js";

export function sendMessageFactory(serviceURL: string) {
    return async function sendMessage(message: string, recipientId: string, quote?: Message) {
        if (!appContext.secretKey) throw new Error("Secret key is not available");
        if (!appContext.imei) throw new Error("IMEI is not available");
        if (!appContext.cookie) throw new Error("Cookie is not available");
        if (!appContext.userAgent) throw new Error("User agent is not available");

        if (quote && !(quote instanceof Message)) throw new Error("Invalid quote message");
        const quoteData = quote!.data;

        const params = quote
            ? {
                  toid: recipientId,
                  message: message,
                  clientId: Date.now(),
                  qmsgOwner: quoteData.uidFrom,
                  qmsgId: quoteData.msgId,
                  qmsgCliId: quoteData.cliMsgId,
                  qmsgType: quoteData.status,
                  qmsgTs: quoteData.ts,
                  qmsg: quoteData.content,
                  imei: appContext.imei,
                  qmsgTTL: quoteData.ttl,
                  ttl: 0,
              }
            : {
                  message: message,
                  clientId: Date.now(),
                  imei: appContext.imei,
                  ttl: 0,
                  toid: recipientId,
              };

        const encryptedParams = encodeAES(appContext.secretKey, JSON.stringify(params));
        if (!encryptedParams) throw new Error("Failed to encrypt message");
        const finalServiceUrl = new URL(serviceURL);
        finalServiceUrl.pathname = finalServiceUrl.pathname + "/" + (quote ? "quote" : "sms");

        const response = await request(finalServiceUrl.toString(), {
            method: "POST",
            body: new URLSearchParams({
                params: encryptedParams,
            }),
        });

        if (!response.ok) throw new Error("Failed to send message: " + response.statusText);

        return decodeAES(appContext.secretKey, (await response.json()).data);
    };
}
