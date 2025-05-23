import { ZaloApiError } from "../Errors/ZaloApiError.js";
import { apiFactory } from "../utils.js";

export type FetchPersonalTodoVerifyResponse = {
    updated: Array<{
        id: string;
        creator: string;
        updateTime: number;
        createTime: number;
        assignees: Array<{
            userId: string;
            status: number;
        }>;
        dueDate: number;
        content: string;
        description: string;
        extra: {
            toUid: string;
            msgType: number;
            msgId: string;
            cliMsgId: string;
            ownerMsgUId: string;
            isGroup: boolean;
            message?: string;
            mention: Array<any>;
        };
        dateDefaultType: number;
        status: number;
        watchers: Array<string>;
        personalBoardType: number;
        dingTimes: number;
        schedule: any;
        attach: any;
    }>;
    scrollId: string;
    timestamp: number;
};

export const getPersonalTodoVerifyFactory = apiFactory<FetchPersonalTodoVerifyResponse>()((api, ctx, utils) => {
    const serviceURL = utils.makeURL(`${api.zpwServiceMap.boards[0]}/api/board/personal/todo/verify`);

    /**
     * get todo verify
     *
     * @param scrollId string
     * @param lastUpdatedTime number
     *
     * @throws ZaloApiError
     *
     */
    return async function getPersonalTodoVerify(scrollId = "", lastUpdatedTime = 0) {
        const params = {
            scrollId,
            lastUpdatedTime,
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
