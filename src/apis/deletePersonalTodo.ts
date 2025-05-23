import { ZaloApiError } from "../Errors/ZaloApiError.js";
import { apiFactory } from "../utils.js";

export type FetchDeletePersonalTodoResponse = string;

export const deletePersonalTodoFactory = apiFactory<FetchDeletePersonalTodoResponse>()((api, ctx, utils) => {
    const serviceURL = utils.makeURL(`${api.zpwServiceMap.boards[0]}/api/board/personal/todo/delete`);

    /**
     * delete todo
     *
     * @throws ZaloApiError
     *
     */
    return async function deletePersonalTodo(taskId: string) {
        const params = {
            id: taskId,
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
