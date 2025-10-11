import { ZaloApiError } from "../../Errors/ZaloApiError.js";
import { apiFactory } from "../../utils.js";

export type FetchLastOnlineResponse = {
    settings: {
        show_online_status: boolean;
    };
    lastOnline: number;
};

export const getLastOnlineFactory = apiFactory<FetchLastOnlineResponse>()((api, ctx, utils) => {
    const serviceURL = utils.makeURL(`${api.zpwServiceMap.profile[0]}/api/social/profile/lastOnline`);

    /**
     * get last online
     *
     * @throws ZaloApiError
     *
     */
    return async function getLastOnline(uid: string) {
        const params = {
            uid: uid,
            conv_type: 1,
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
