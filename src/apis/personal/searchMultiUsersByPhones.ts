import { ZaloApiError } from "../../Errors/ZaloApiError.js";
import { apiFactory } from "../../utils.js";

export type SearchMultiUserByPhoneResponse = {};

export const searchMultiUserByPhoneFactory = apiFactory<SearchMultiUserByPhoneResponse>()((api, ctx, utils) => {
    const serviceURL = utils.makeURL(`${api.zpwServiceMap.friend[0]}/api/friend/profile/multiget`);

    /**
     * Find user by phone number
     *
     * @param phoneNumber Phone number
     *
     * @throws ZaloApiError
     */
    return async function searchMultiUserByPhone(phoneNumber: string) {
        if (!phoneNumber) throw new ZaloApiError("Missing phoneNumber");

        const params = {
            phones: phoneNumber,
            avatar_size: 240,
            language: ctx.language,
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

            return result.data as SearchMultiUserByPhoneResponse;
        });
    };
});
