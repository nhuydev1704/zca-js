import { ZaloApiError } from "../Errors/ZaloApiError.js";
import { apiFactory } from "../utils.js";

export type FetchLastMsgResponse = {
    lastActionId: string;
    lastActionIdOther: string;
    more: number;
    msgs: Array<any>;
    groupMsgs: Array<any>;
    pageMsgs: Array<any>;
    clearUnreads: Array<{
        actionId: string;
        idTo: string;
        lastMsgId: string;
        isGroup: number;
        type: number;
    }>;
    clearUnreadsReact: Array<{
        actionId: string;
        idTo: string;
        lastMsgId: string;
        isGroup: number;
        type: number;
    }>;
};

export const getLastMsgFactory = apiFactory<FetchLastMsgResponse>()((api, ctx, utils) => {
    const serviceURL = utils.makeURL(`${api.zpwServiceMap.conversation[0]}/api/preloadconvers/get-last-msgs`);

    /**
     * get last message
     *
     * @param threadIdLocalMsgId object user_id_0:conversation_id
     *
     * @throws ZaloApiError
     *
     */
    return async function addGroupDeputy(threadIdLocalMsgId: { [key: string]: string }) {
        const params = {
            threadIdLocalMsgId: JSON.stringify(threadIdLocalMsgId),
            imei: ctx.imei,
        };

        const encryptedParams = utils.encodeAES(JSON.stringify(params));
        if (!encryptedParams) throw new ZaloApiError("Failed to encrypt params");

        const urlWithParams = `${serviceURL}&params=${encodeURIComponent(encryptedParams)}`;

        const response = await utils.request(urlWithParams, {
            method: "GET",
        });

        return utils.resolve(response);
    };
});
