import { ZaloApiError } from "../Errors/ZaloApiError.js";
import { apiFactory } from "../utils.js";

export type FetchUpdateStatusPersonalTodoResponse = string;

export const updateStatusPersonalTodoFactory = apiFactory<FetchUpdateStatusPersonalTodoResponse>()((
    api,
    ctx,
    utils,
) => {
    const serviceURL = utils.makeURL(`${api.zpwServiceMap.boards[0]}/api/board/personal/todo/status`);

    /**
     * Cập nhật trạng thái
     *
     * @throws ZaloApiError
     *
     */
    return async function updateStatusPersonalTodo(taskId: string, status: number) {
        const params = {
            id: taskId,
            status, // 0: chưa hoàn thành, 1: đã hoàn thành
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
