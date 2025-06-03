import { ZaloApiError } from "../../Errors/ZaloApiError.js";
import { apiFactory } from "../../utils.js";

export type FetchLinkGroupResponse = {
    link: string;
    expiration_date: number;
    enabled: number;
};

export const getLinkGroupFactory = apiFactory<FetchLinkGroupResponse>()((api, ctx, utils) => {
    const serviceURL = utils.makeURL(`${api.zpwServiceMap.group[0]}/api/group/link/detail`);

    /**
     * get link group
     *
     * @throws ZaloApiError
     *
     */
    return async function getLinkGroup(grid: string) {
        const params = {
            grid,
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
