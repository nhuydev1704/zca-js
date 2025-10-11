import { ZaloApiError } from "../../Errors/ZaloApiError.js";
import { apiFactory } from "../../utils.js";

export type GetPhoneBookResponse = {
    version: number;
    phonebook: Record<string, string>;
};

export const getPhoneBookFactory = apiFactory<GetPhoneBookResponse>()((api, ctx, utils) => {
    const serviceURL = utils.makeURL(`${api.zpwServiceMap.profile[0]}/api/social/friend/phonebook/v2`);

    /**
     * Get all friends
     *
     * @param count Page size (default: 20000)
     * @param page Page number (default: 1)
     *
     * @throws ZaloApiError
     */
    return async function () {
        const params = {
            phonebook_version: 0,
        };

        const encryptedParams = utils.encodeAES(JSON.stringify(params));
        if (!encryptedParams) throw new ZaloApiError("Failed to encrypt message");

        const response = await utils.request(
            utils.makeURL(serviceURL, {
                params: encryptedParams,
            }),
            {
                method: "GET",
            },
        );

        return utils.resolve(response);
    };
});
