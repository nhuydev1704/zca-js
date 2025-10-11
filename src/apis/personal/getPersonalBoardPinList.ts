import { ZaloApiError } from "../../Errors/ZaloApiError.js";
import { apiFactory } from "../../utils.js";

export type FetchPersonalBoardPinListResponse = {
    data: Array<{
        id: string;
        type: number;
        color: number;
        emoji: string;
        startTime: number;
        duration: number;
        params: string;
        creatorId: string;
        editorId: string;
        createTime: number;
        editTime: number;
        repeat: number;
    }>;
    version: number;
};

export const getPersonalBoardPinListFactory = apiFactory<FetchPersonalBoardPinListResponse>()((api, ctx, utils) => {
    const serviceURL = utils.makeURL(`${api.zpwServiceMap.friend_board[0]}/api/friendboard/list`);

    /**
     * get friend board pin list
     *
     * @throws ZaloApiError
     *
     */
    return async function getPersonalBoardPinList(conversationId: string) {
        const params = {
            conversationId,
            version: 0,
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
