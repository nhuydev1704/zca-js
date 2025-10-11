import { ZaloApiError } from "../../Errors/ZaloApiError.js";
import { apiFactory } from "../../utils.js";

export type FetchGroupBoardListResponse = {
    items: Array<{
        boardType: number;
        data: {
            id?: string;
            type?: number;
            color?: number;
            emoji?: string;
            startTime?: number;
            duration?: number;
            params?: string;
            creatorId?: string;
            editorId?: string;
            createTime?: number;
            editTime?: number;
            repeat?: number;
            creator?: string;
            question?: string;
            options?: Array<{
                content: string;
                votes: number;
                voted: boolean;
                voters: Array<string>;
                option_id: number;
            }>;
            joined?: boolean;
            closed?: boolean;
            poll_id?: number;
            allow_multi_choices?: boolean;
            allow_add_new_option?: boolean;
            is_anonymous?: boolean;
            poll_type?: number;
            created_time?: number;
            updated_time?: number;
            expired_time?: number;
            is_hide_vote_preview?: boolean;
            num_vote?: number;
        };
    }>;
    count: number;
};

export const getGroupBoardListFactory = apiFactory<FetchGroupBoardListResponse>()((api, ctx, utils) => {
    const serviceURL = utils.makeURL(`${api.zpwServiceMap.group_board[0]}/api/board/list`);

    /**
     * get group board list
     *
     * @throws ZaloApiError
     *
     */
    return async function getGroupBoardList(groupId: string) {
        const params = {
            group_id: groupId,
            board_type: 0, // 0: all, 2: tin gim, 3: bình chọn
            page: 1,
            count: 20,
            last_id: 0,
            last_type: 0,
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
