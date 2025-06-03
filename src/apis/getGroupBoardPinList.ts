import { ZaloApiError } from "../Errors/ZaloApiError.js";
import { apiFactory } from "../utils.js";

export type FetchGroupBoardPinListResponse = {
    pinLimit: number;
    groupId: string;
    boardVersion: number;
    items: Array<{
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
};

export const getGroupBoardPinListFactory = apiFactory<FetchGroupBoardPinListResponse>()((api, ctx, utils) => {
    const serviceURL = utils.makeURL(`${api.zpwServiceMap.group_board[0]}/api/board/pin/list`);

    /**
     * get group board pin list
     *
     * @throws ZaloApiError
     *
     */
    return async function getGroupBoardPinList(groupId: string) {
        const params = {
            groupId,
            boardVersion: 0,
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
