import { ZaloApiError } from "../../Errors/ZaloApiError.js";
import { apiFactory } from "../../utils.js";

export type SearchByUsernameResponse = {
    uid: string;
};

export const searchByUsernameFactory = apiFactory<SearchByUsernameResponse>()((api, _, utils) => {
    const serviceURL = utils.makeURL(`${api.zpwServiceMap.friend[0]}/api/friend/search/by-user-name`);

    /**
     * Search by username
     *
     * @param username The username to search for
     *
     * @throws ZaloApiError
     */
    return async function searchByUsername(user_name: string) {
        if (!user_name) throw new ZaloApiError("Missing phoneNumber");

        const params = {
            user_name,
            avatar_size: 240,
        };

        const encryptedParams = utils.encodeAES(JSON.stringify(params));
        if (!encryptedParams) throw new ZaloApiError("Failed to encrypt message");

        const finalServiceUrl = new URL(serviceURL);
        finalServiceUrl.searchParams.append("params", encryptedParams);

        const response = await utils.request(
            utils.makeURL(finalServiceUrl.toString(), {
                params: encryptedParams,
            }),
        );

        return utils.resolve(response, (result) => {
            if (result.error && result.error.code != 216)
                throw new ZaloApiError(result.error.message, result.error.code);

            return result.data as SearchByUsernameResponse;
        });
    };
});
