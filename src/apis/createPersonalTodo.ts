import { ZaloApiError } from "../Errors/ZaloApiError.js";
import { apiFactory } from "../utils.js";

interface CreatePersonalTodoOptions {
    assignees: string;
    dueDate: number;
    content: string;
    description: string;
    extra: string;
    dateDefaultType: number;
    status: number;
    watchers: string;
    schedule: any;
    src: number;
    imei: string;
}

export type FetchCreatePersonalTodoResponse = {
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
        message: string;
        mention: Array<any>;
    };
    dateDefaultType: number;
    status: number;
    watchers: Array<any>;
    personalBoardType: number;
    dingTimes: number;
    schedule: {
        repeat: any;
        startTime: number;
        endTime: number;
    };
    attach: any;
};

export const createPersonalTodoFactory = apiFactory<FetchCreatePersonalTodoResponse>()((api, ctx, utils) => {
    const serviceURL = utils.makeURL(`${api.zpwServiceMap.boards[0]}/api/board/personal/todo/create`);

    /** createPersonalTodo  */
    return async function createPersonalTodo(data: CreatePersonalTodoOptions) {
        const params = {
            assignees: data?.assignees || "", // "[\"8587749337157395374\",\"2141781428396727610\"]",
            dueDate: data?.dueDate || -1, // -1 là không có thời gian
            content: data?.content || "", // "nội dung gv",
            description: data?.description || "", // "tiêu đề gv",
            extra: data?.extra || "", // "{\"msgId\":\"6593192185167\",\"toUid\":\"8587749337157395374\",\"isGroup\":false,\"cliMsgId\":\"1747027409793\",\"msgType\":1,\"mention\":[],\"ownerMsgUId\":\"2141781428396727610\",\"message\":\"nội dung gv\"}",
            dateDefaultType: data?.dateDefaultType || 0,
            status: data?.status || 0,
            watchers: data?.watchers || "", //"[\"8587749337157395374\"]",
            schedule: data?.schedule || null,
            src: data?.src || 5,
            imei: ctx.imei,
        };

        const encryptedParams = utils.encodeAES(JSON.stringify(params));
        if (!encryptedParams) throw new ZaloApiError("Failed to encrypt params");

        const response = await utils.request(serviceURL, {
            method: "POST",
            body: new URLSearchParams({
                params: encryptedParams,
            }),
        });

        return utils.resolve(response);
    };
});
