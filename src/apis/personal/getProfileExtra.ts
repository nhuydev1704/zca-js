import { ZaloApiError } from "../../Errors/ZaloApiError.js";
import { apiFactory } from "../../utils.js";

export type FetchProfileExtraResponse = {
    totalPhotos: number;
    photos: any[];
    groupIds: string[];
    photoMetas: any[];
    bkPhotos: any[];
};

export const getProfileExtraFactory = apiFactory<FetchProfileExtraResponse>()((api, ctx, utils) => {
    const serviceURL = utils.makeURL(`${api.zpwServiceMap.profile[0]}/api/social/profile/extra`);

    /**
     * get avatar
     *
     * @throws ZaloApiError
     *
     */
    return async function getProfileExtra(fid: string) {
        const params = {
            profile_id: fid,
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
