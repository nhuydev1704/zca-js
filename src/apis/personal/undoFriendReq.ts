import { ZaloApiError } from "../../Errors/ZaloApiError.js";
import { apiFactory } from "../../utils.js";

export type UndoFriendRequestResponse = ""; // add response after

export const undoFriendRequestFactory = apiFactory<UndoFriendRequestResponse>()((api, _, utils) => {
    const serviceURL = utils.makeURL(`${api.zpwServiceMap.friend[0]}/api/friend/undo`);

    /**
     * undo a friend request to a user.
     *
     * @param msg message sent with friend request
     * @param userId User ID to send friend request to
     *
     * @throws ZaloApiError
     */
    return async function undoFriendRequest(userId: string) {
        const params = {
            fid: userId,
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
