import { ZaloApiError } from "../../Errors/ZaloApiError.js";
import { apiFactory } from "../../utils.js";

export type CategoryStickersDetailResponse = {
    id: number;
    name: string;
    desc: string;
    totalImage: number;
    thumbUrl: string;
    iconUrl: string;
    iconPreview: string;
    price: number;
    group: number;
    status: number;
    version: number;
    thumbImg: string;
    source: string;
    type: number;
    sourceUrl: string;
    permission: number;
    expireTime: number;
    is_hidden: number;
    order: number;
};

export const getCategoryStickersDetailFactory = apiFactory<CategoryStickersDetailResponse>()((api, ctx, utils) => {
    const serviceURL = utils.makeURL(`${api.zpwServiceMap.sticker}/api/message/sticker/category/detail`);

    /**
     * Get stickers by keyword
     *
     * @param keyword Keyword to search for
     * @returns Sticker IDs
     *
     * @throws ZaloApiError
     */
    return async function getCategoryStickersDetail(cid: string) {
        const params = {
            cid,
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
