import { ZaloApiError } from "../../Errors/ZaloApiError.js";
import { apiFactory } from "../../utils.js";

export type FetchListReminderResponse = string;

export const getListReminderFactory = apiFactory<FetchListReminderResponse>()((api, ctx, utils) => {
    const serviceURL = utils.makeURL(`${api.zpwServiceMap.group_board[0]}/api/board/listReminder`);

    /**
     * get listReminder
     *
     * @throws ZaloApiError
     *
     */
    return async function getListReminder({
        isGroup = false,
        uid = "",
        groupId = "",
        page = 1,
        count = 20,
        board_type = 1,
    }) {
        const params = {
            objectData: JSON.stringify(
                isGroup
                    ? {
                          group_id: groupId,
                          board_type,
                          page,
                          count,
                          last_id: 0,
                          last_type: 0,
                      }
                    : {
                          uid,
                          board_type,
                          page,
                          count,
                          last_id: 0,
                          last_type: 0,
                      },
            ),
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
