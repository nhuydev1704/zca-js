import { ZaloApiError } from "../../Errors/ZaloApiError.js";
import { apiFactory } from "../../utils.js";

export type CategoryStickersRecommendedResponse = Array<{
    stickers: Array<{
        id: number;
        type: number;
    }>;
    id: number;
    promoted: number;
}>;

export const getCategoryStickersRecommendedFactory = apiFactory<CategoryStickersRecommendedResponse>()((
    api,
    ctx,
    utils,
) => {
    const serviceURL = utils.makeURL(`${api.zpwServiceMap.sticker}/api/message/sticker/recommended`);

    /**
     * Get stickers by keyword
     *
     * @param keyword Keyword to search for
     * @returns Sticker IDs
     *
     * @throws ZaloApiError
     */
    return async function getCategoryStickersRecommended() {
        const params = {
            emei: ctx.imei,
        };

        const encryptedParams = utils.encodeAES(JSON.stringify(params));
        if (!encryptedParams) throw new ZaloApiError("Failed to encrypt message");

        const response = await utils.request(
            utils.makeURL(serviceURL, {
                params: encryptedParams,
            }),
        );

        return utils.resolve(response);
    };
});
