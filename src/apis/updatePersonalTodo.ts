import { ZaloApiError } from "../Errors/ZaloApiError.js";
import { apiFactory } from "../utils.js";

interface UpdatePersonalTodoOptions {
    id: string;
    assignees: string;
    content: string;
    creator: string;
    dateDefaultType: number;
    description: string;
    dueDate: number;
    extra: string;
    watchers: string;
    status: number;
    schedule: any;
}

export type UpdatePersonalTodoResponse = {
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

export const updatePersonalTodoFactory = apiFactory<UpdatePersonalTodoResponse>()((api, ctx, utils) => {
    const serviceURL = utils.makeURL(`${api.zpwServiceMap.boards[0]}/api/board/personal/todo/update`);

    /** updatePersonalTodo  */
    return async function updatePersonalTodo(data: UpdatePersonalTodoOptions) {
        const params: UpdatePersonalTodoOptions = {
            id: data?.id || "", // "6593192185167",
            creator: data?.creator || "", // "8587749337157395374",
            assignees: data?.assignees || "", // "[\"8587749337157395374\",\"2141781428396727610\"]",
            dueDate: data?.dueDate || -1, // -1 là không có thời gian
            content: data?.content || "", // "nội dung gv",
            description: data?.description || "", // "tiêu đề gv",
            extra: data?.extra || "", // "{\"msgId\":\"6593192185167\",\"toUid\":\"8587749337157395374\",\"isGroup\":false,\"cliMsgId\":\"1747027409793\",\"msgType\":1,\"mention\":[],\"ownerMsgUId\":\"2141781428396727610\",\"message\":\"nội dung gv\"}",
            dateDefaultType: data?.dateDefaultType || 0,
            status: data?.status || 0,
            watchers: data?.watchers || "", //"[\"8587749337157395374\"]",
            schedule: data?.schedule || null,
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
