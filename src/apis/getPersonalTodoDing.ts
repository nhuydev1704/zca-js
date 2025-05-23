import { ZaloApiError } from "../Errors/ZaloApiError.js";
import { apiFactory } from "../utils.js";

export type FetchPersonalTodoDingResponse = string;

export const getPersonalTodoDingFactory = apiFactory<FetchPersonalTodoDingResponse>()((api, ctx, utils) => {
    const serviceURL = utils.makeURL(`${api.zpwServiceMap.boards[0]}/api/board/personal/todo/ding`);

    /**
     * get todo ding (ngắc nhở)
     *
     * @throws ZaloApiError
     *
     */
    return async function getPersonalTodoDing(taskIds: string[]) {
        const params = {
            taskIds,
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
