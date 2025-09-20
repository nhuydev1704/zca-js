import { loginQR, LoginQRCallbackEventType, type LoginQRCallback } from "./apis/loginQR.js";
import { getServerInfo, login } from "./apis/login.js";
import { createContext, isContextSession, type ContextBase, type Options } from "./context.js";
import { generateZaloUUID, logger } from "./utils.js";

import toughCookie from "tough-cookie";

import { ZaloApiError } from "./Errors/ZaloApiError.js";
import { checkUpdate } from "./update.js";

import { customFactory } from "./apis/custom.js";
import { getPhoneBookFactory } from "./apis/getPhoneBook.js";
import { getLastMsgFactory } from "./apis/getLastMsg.js";
import { getPersonalTodoVerifyFactory } from "./apis/getPersonalTodoVerify.js";
import { createPersonalTodoFactory } from "./apis/createPersonalTodo.js";
import { updatePersonalTodoFactory } from "./apis/updatePersonalTodo.js";
import { deletePersonalTodoFactory } from "./apis/deletePersonalTodo.js";
import { getPersonalTodoDetailFactory } from "./apis/getPersonalTodoDetail.js";
import { getPersonalTodoDingFactory } from "./apis/getPersonalTodoDing.js";
import { updateStatusPersonalTodoFactory } from "./apis/updateStatusPersonalTodo.js";
import { getAvatarFactory } from "./apis/getAvatar.js";
import { getPersonalBoardPinListFactory } from "./apis/getPersonalBoardPinList.js";
import { getGroupBoardPinListFactory } from "./apis/getGroupBoardPinList.js";
import { getGroupBoardListFactory } from "./apis/groups/getGroupBoardList.js";
import { getListReminderFactory } from "./apis/groups/getListReminder.js";
import { getLinkGroupFactory } from "./apis/groups/getLinkGroup.js";
import { getPersonalizedStickersFactory } from "./apis/stickers/getPersonalizedStickers.js";
import { getCategoryStickersFactory } from "./apis/stickers/getCategoryStickers.js";
import { getCategoryStickersDetailFactory } from "./apis/stickers/getCategoryStickersDetail.js";
import { getStickersSuggestionFactory } from "./apis/stickers/getStickersSuggestion.js";
import { getCategoryStickersRecommendedFactory } from "./apis/stickers/getCategoryStickersRecommended.js";
import { getSearchStickersFactory } from "./apis/stickers/getSearchStickers.js";
import { getCategoryStickersDetailStickFactory } from "./apis/stickers/getCategoryStickersDetailStick.js";
import { getProfileExtraFactory } from "./apis/personal/getProfileExtra.js";
import { getLastOnlineFactory } from "./apis/personal/getLastOnline.js";
import { getFriendReqStatusFactory } from "./apis/personal/getFriendReqStatus.js";
import { undoFriendRequestFactory } from "./apis/personal/undoFriendReq.js";
import { rejectFriendRequestFactory } from "./apis/personal/rejectFriendReq.js";
import { API } from "./apis.js";

export type Cookie = {
    domain: string;
    expirationDate: number;
    hostOnly: boolean;
    httpOnly: boolean;
    name: string;
    path: string;
    sameSite: string;
    secure: boolean;
    session: boolean;
    storeId: string;
    value: string;
};

export type Credentials = {
    imei: string;
    cookie: Cookie[] | toughCookie.SerializedCookie[] | { url: string; cookies: Cookie[] };
    userAgent: string;
    language?: string;
};

export class Zalo {
    private enableEncryptParam = true;

    constructor(private options: Partial<Options> = {}) {}

    private parseCookies(cookie: Credentials["cookie"]): toughCookie.CookieJar {
        const cookieArr = Array.isArray(cookie) ? cookie : cookie.cookies;

        cookieArr.forEach((e, i) => {
            if (typeof e.domain == "string" && e.domain.startsWith(".")) cookieArr[i].domain = e.domain.slice(1);
        });

        const jar = new toughCookie.CookieJar();
        for (const each of cookieArr) {
            try {
                jar.setCookieSync(
                    toughCookie.Cookie.fromJSON({
                        ...each,
                        key: (each as toughCookie.SerializedCookie).key || each.name,
                    }) ?? "",
                    "https://chat.zalo.me",
                );
            } catch (error: unknown) {
                logger({
                    options: {
                        logging: this.options.logging,
                    },
                }).error("Failed to set cookie:", error);
            }
        }
        return jar;
    }

    private validateParams(credentials: Credentials) {
        if (!credentials.imei || !credentials.cookie || !credentials.userAgent) {
            throw new ZaloApiError("Missing required params");
        }
    }

    public async login(credentials: Credentials) {
        const ctx = createContext(this.options.apiType, this.options.apiVersion);
        Object.assign(ctx.options, this.options);

        return this.loginCookie(ctx, credentials);
    }

    private async loginCookie(ctx: ContextBase, credentials: Credentials) {
        await checkUpdate(ctx);

        this.validateParams(credentials);

        ctx.imei = credentials.imei;
        ctx.cookie = this.parseCookies(credentials.cookie);
        ctx.userAgent = credentials.userAgent;
        ctx.language = credentials.language || "vi";

        const loginData = await login(ctx, this.enableEncryptParam);
        const serverInfo = await getServerInfo(ctx, this.enableEncryptParam);

        const loginInfo = loginData?.data as typeof ctx.loginInfo;

        if (!loginData || !loginInfo || !serverInfo) throw new ZaloApiError("Đăng nhập thất bại");

        ctx.secretKey = loginInfo.zpw_enk;
        ctx.uid = loginInfo.uid;

        // Zalo currently responds with setttings instead of settings
        // they might fix this in the future, so we should have a fallback just in case
        ctx.settings = serverInfo.setttings || serverInfo.settings;

        ctx.extraVer = serverInfo.extra_ver;
        ctx.loginInfo = loginInfo;

        if (!isContextSession(ctx)) throw new ZaloApiError("Khởi tạo ngữ cảnh thất bại.");

        logger(ctx).info("Logged in as", loginInfo.uid);

        return new API(ctx, loginInfo.zpw_service_map_v3, loginInfo.zpw_ws);
    }

    private async onlyLoginCookie(ctx: ContextBase, credentials: Credentials) {
        await checkUpdate(ctx);

        this.validateParams(credentials);

        ctx.imei = credentials.imei;
        ctx.cookie = this.parseCookies(credentials.cookie);
        ctx.userAgent = credentials.userAgent;
        ctx.language = credentials.language || "vi";

        const loginData = await login(ctx, this.enableEncryptParam);
        const serverInfo = await getServerInfo(ctx, this.enableEncryptParam);

        if (!loginData || !serverInfo) throw new Error("Đăng nhập thất bại");
        ctx.secretKey = loginData.data.zpw_enk;
        ctx.uid = loginData.data.uid;

        // Zalo currently responds with setttings instead of settings
        // they might fix this in the future, so we should have a fallback just in case
        ctx.settings = serverInfo.setttings || serverInfo.settings;

        ctx.extraVer = serverInfo.extra_ver;

        if (!isContextSession(ctx)) throw new Error("Khởi tạo ngữ cảnh thát bại.");

        logger(ctx).info("Logged in as", loginData.data.uid);

        return loginData.data;
    }

    public async onlyLoginQr(
        options: { userAgent?: string; language?: string; qrPath?: string },
        callback: LoginQRCallback,
    ) {
        if (!options) options = {};
        if (!options.userAgent)
            options.userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0";
        if (!options.language) options.language = "vi";

        const ctx = createContext(this.options.apiType, this.options.apiVersion);
        Object.assign(ctx.options, this.options);

        const loginQRResult = await loginQR(
            ctx,
            options as { userAgent: string; language: string; qrPath?: string },
            callback,
        );
        if (!loginQRResult) throw new ZaloApiError("Unable to login with QRCode");

        const imei = generateZaloUUID(options.userAgent);

        // login account with cookie
        const loginData = await this.onlyLoginCookie(ctx, {
            cookie: loginQRResult.cookies,
            imei,
            userAgent: options.userAgent,
            language: options.language,
        });

        // Thanks to @YanCastle for this great suggestion!
        return callback({
            type: LoginQRCallbackEventType.GotLoginInfo,
            data: {
                cookie: loginQRResult.cookies,
                imei,
                userAgent: options.userAgent,
                loginData,
                userInfo: loginQRResult.userInfo,
            },
            actions: null,
        });
    }

    public async loginQR(
        options?: { userAgent?: string; language?: string; qrPath?: string },
        callback?: LoginQRCallback,
    ) {
        if (!options) options = {};
        if (!options.userAgent)
            options.userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0";
        if (!options.language) options.language = "vi";

        const ctx = createContext(this.options.apiType, this.options.apiVersion);
        Object.assign(ctx.options, this.options);

        const loginQRResult = await loginQR(
            ctx,
            options as { userAgent: string; language: string; qrPath?: string },
            callback,
        );
        if (!loginQRResult) throw new ZaloApiError("Unable to login with QRCode");

        const imei = generateZaloUUID(options.userAgent);

        if (callback) {
            // Thanks to @YanCastle for this great suggestion!
            callback({
                type: LoginQRCallbackEventType.GotLoginInfo,
                data: {
                    cookie: loginQRResult.cookies,
                    imei,
                    userAgent: options.userAgent,
                },
                actions: null,
            });
        }

        return this.loginCookie(ctx, {
            cookie: loginQRResult.cookies,
            imei,
            userAgent: options.userAgent,
            language: options.language,
        });
    }
}

export class API {
    public zpwServiceMap: ZPWServiceMap;
    public listener: Listener;

    public acceptFriendRequest: ReturnType<typeof acceptFriendRequestFactory>;
    public addGroupDeputy: ReturnType<typeof addGroupDeputyFactory>;
    public addHiddenConversPin: ReturnType<typeof addHiddenConversPinFactory>;
    public addQuickMessage: ReturnType<typeof addQuickMessageFactory>;
    public addReaction: ReturnType<typeof addReactionFactory>;
    public addUnreadMark: ReturnType<typeof addUnreadMarkFactory>;
    public addUserToGroup: ReturnType<typeof addUserToGroupFactory>;
    public autoDeleteChat: ReturnType<typeof autoDeleteChatFactory>;
    public blockUser: ReturnType<typeof blockUserFactory>;
    public blockViewFeed: ReturnType<typeof blockViewFeedFactory>;
    // public changeAccountAvatar: ReturnType<typeof changeAccountAvatarFactory>;
    public changeGroupAvatar: ReturnType<typeof changeGroupAvatarFactory>;
    public changeGroupName: ReturnType<typeof changeGroupNameFactory>;
    public changeGroupOwner: ReturnType<typeof changeGroupOwnerFactory>;
    public changeFriendAlias: ReturnType<typeof changeFriendAliasFactory>;
    public createGroup: ReturnType<typeof createGroupFactory>;
    public createNote: ReturnType<typeof createNoteFactory>;
    public createPoll: ReturnType<typeof createPollFactory>;
    public deleteChat: ReturnType<typeof deleteChatFactory>;
    public deleteMessage: ReturnType<typeof deleteMessageFactory>;
    public disableGroupLink: ReturnType<typeof disableGroupLinkFactory>;
    public disperseGroup: ReturnType<typeof disperseGroupFactory>;
    public editNote: ReturnType<typeof editNoteFactory>;
    public enableGroupLink: ReturnType<typeof enableGroupLinkFactory>;
    public fetchAccountInfo: ReturnType<typeof fetchAccountInfoFactory>;
    public findUser: ReturnType<typeof findUserFactory>;
    public forwardMessage: ReturnType<typeof forwardMessageFactory>;
    public getAliasList: ReturnType<typeof getAliasListFactory>;
    public getAllFriends: ReturnType<typeof getAllFriendsFactory>;
    public getPhoneBooks: ReturnType<typeof getPhoneBookFactory>;
    public getAllGroups: ReturnType<typeof getAllGroupsFactory>;
    public getAutoDeleteChat: ReturnType<typeof getAutoDeleteChatFactory>;
    public getBizAccount: ReturnType<typeof getBizAccountFactory>;
    public getCookie: ReturnType<typeof getCookieFactory>;
    public getFriendRequest: ReturnType<typeof getFriendRequestFactory>;
    public getGroupInfo: ReturnType<typeof getGroupInfoFactory>;
    public getGroupMembersInfo: ReturnType<typeof getGroupMembersInfoFactory>;
    public getHiddenConversPin: ReturnType<typeof getHiddenConversPinFactory>;
    public getMute: ReturnType<typeof getMuteFactory>;
    public getLabels: ReturnType<typeof getLabelsFactory>;
    public getOwnId: ReturnType<typeof getOwnIdFactory>;
    public getPollDetail: ReturnType<typeof getPollDetailFactory>;
    public getContext: ReturnType<typeof getContextFactory>;
    public getQR: ReturnType<typeof getQRFactory>;
    public getQuickMessage: ReturnType<typeof getQuickMessageFactory>;
    public getStickers: ReturnType<typeof getStickersFactory>;
    public getStickersDetail: ReturnType<typeof getStickersDetailFactory>;
    public getUnreadMark: ReturnType<typeof getUnreadMarkFactory>;
    public getUserInfo: ReturnType<typeof getUserInfoFactory>;
    public inviteUserToGroups: ReturnType<typeof inviteUserToGroupsFactory>;
    public keepAlive: ReturnType<typeof keepAliveFactory>;
    public lockPoll: ReturnType<typeof lockPollFactory>;
    public parseLink: ReturnType<typeof parseLinkFactory>;
    public pinConversations: ReturnType<typeof pinConversationsFactory>;
    public removeFriendAlias: ReturnType<typeof removeFriendAliasFactory>;
    public removeGroupDeputy: ReturnType<typeof removeGroupDeputyFactory>;
    public removeHiddenConversPin: ReturnType<typeof removeHiddenConversPinFactory>;
    public removeQuickMessage: ReturnType<typeof removeQuickMessageFactory>;
    public removeUnreadMark: ReturnType<typeof removeUnreadMarkFactory>;
    public removeUserFromGroup: ReturnType<typeof removeUserFromGroupFactory>;
    public resetHiddenConversPin: ReturnType<typeof resetHiddenConversPinFactory>;
    public sendCard: ReturnType<typeof sendCardFactory>;
    public sendDeliveredEvent: ReturnType<typeof sendDeliveredEventFactory>;
    public sendFriendRequest: ReturnType<typeof sendFriendRequestFactory>;
    public sendLink: ReturnType<typeof sendLinkFactory>;
    public sendMessage: ReturnType<typeof sendMessageFactory>;
    public sendReport: ReturnType<typeof sendReportFactory>;
    public sendSeenEvent: ReturnType<typeof sendSeenEventFactory>;
    public sendSticker: ReturnType<typeof sendStickerFactory>;
    public sendTypingEvent: ReturnType<typeof sendTypingEventFactory>;
    public sendVideo: ReturnType<typeof sendVideoFactory>;
    public sendVoice: ReturnType<typeof sendVoiceFactory>;
    public setMute: ReturnType<typeof setMuteFactory>;
    public unblockUser: ReturnType<typeof unblockUserFactory>;
    public undo: ReturnType<typeof undoFactory>;
    public updateAutoDeleteChat: ReturnType<typeof updateAutoDeleteChatFactory>;
    public updateGroupSettings: ReturnType<typeof updateGroupSettingsFactory>;
    public updateHiddenConversPin: ReturnType<typeof updateHiddenConversPinFactory>;
    public updateLabels: ReturnType<typeof updateLabelsFactory>;
    public updateLang: ReturnType<typeof updateLangFactory>;
    public updateProfile: ReturnType<typeof updateProfileFactory>;
    public updateSettings: ReturnType<typeof updateSettingsFactory>;
    public updateQuickMessage: ReturnType<typeof updateQuickMessageFactory>;
    public uploadAttachment: ReturnType<typeof uploadAttachmentFactory>;
    public getLastMsg: ReturnType<typeof getLastMsgFactory>;
    public getPersonalTodoVerify: ReturnType<typeof getPersonalTodoVerifyFactory>;
    public createPersonalTodo: ReturnType<typeof createPersonalTodoFactory>;
    public updatePersonalTodo: ReturnType<typeof updatePersonalTodoFactory>;
    public updateStatusPersonalTodo: ReturnType<typeof updateStatusPersonalTodoFactory>;
    public getPersonalTodoDing: ReturnType<typeof getPersonalTodoDingFactory>;
    public deletePersonalTodo: ReturnType<typeof deletePersonalTodoFactory>;
    public getPersonalTodoDetail: ReturnType<typeof getPersonalTodoDetailFactory>;
    public getAvatar: ReturnType<typeof getAvatarFactory>;
    // add new 25/05/2025
    public getPersonalBoardPinList: ReturnType<typeof getPersonalBoardPinListFactory>;
    public getGroupBoardPinList: ReturnType<typeof getGroupBoardPinListFactory>;
    public getGroupBoardList: ReturnType<typeof getGroupBoardListFactory>;
    public getListReminder: ReturnType<typeof getListReminderFactory>;
    public getLinkGroup: ReturnType<typeof getLinkGroupFactory>;
    public getPersonalizedStickers: ReturnType<typeof getPersonalizedStickersFactory>;
    public getCategoryStickers: ReturnType<typeof getCategoryStickersFactory>;
    public getCategoryStickersDetail: ReturnType<typeof getCategoryStickersDetailFactory>;
    public getStickersSuggestion: ReturnType<typeof getStickersSuggestionFactory>;
    public getCategoryStickersRecommended: ReturnType<typeof getCategoryStickersRecommendedFactory>;
    public getSearchStickers: ReturnType<typeof getSearchStickersFactory>;
    public getCategoryStickersDetailStick: ReturnType<typeof getCategoryStickersDetailStickFactory>;
    // add 03/06/2025
    public getProfileExtra: ReturnType<typeof getProfileExtraFactory>;
    public getLastOnline: ReturnType<typeof getLastOnlineFactory>;
    public getFriendReqStatus: ReturnType<typeof getFriendReqStatusFactory>;
    public undoFriendRequest: ReturnType<typeof undoFriendRequestFactory>;
    public rejectFriendRequest: ReturnType<typeof rejectFriendRequestFactory>;

    public custom: ReturnType<typeof customFactory>;

    constructor(ctx: ContextSession, zpwServiceMap: ZPWServiceMap, wsUrls: string[]) {
        this.zpwServiceMap = zpwServiceMap;
        this.listener = new Listener(ctx, wsUrls);

        this.acceptFriendRequest = acceptFriendRequestFactory(ctx, this);
        this.addGroupDeputy = addGroupDeputyFactory(ctx, this);
        this.addHiddenConversPin = addHiddenConversPinFactory(ctx, this);
        this.addQuickMessage = addQuickMessageFactory(ctx, this);
        this.addReaction = addReactionFactory(ctx, this);
        this.addUnreadMark = addUnreadMarkFactory(ctx, this);
        this.addUserToGroup = addUserToGroupFactory(ctx, this);
        this.autoDeleteChat = autoDeleteChatFactory(ctx, this);
        this.blockUser = blockUserFactory(ctx, this);
        this.blockViewFeed = blockViewFeedFactory(ctx, this);
        // this.changeAccountAvatar = changeAccountAvatarFactory(ctx, this);
        this.changeGroupAvatar = changeGroupAvatarFactory(ctx, this);
        this.changeGroupName = changeGroupNameFactory(ctx, this);
        this.changeGroupOwner = changeGroupOwnerFactory(ctx, this);
        this.changeFriendAlias = changeFriendAliasFactory(ctx, this);
        this.createGroup = createGroupFactory(ctx, this);
        this.createNote = createNoteFactory(ctx, this);
        this.createPoll = createPollFactory(ctx, this);
        this.deleteChat = deleteChatFactory(ctx, this);
        this.deleteMessage = deleteMessageFactory(ctx, this);
        this.disableGroupLink = disableGroupLinkFactory(ctx, this);
        this.disperseGroup = disperseGroupFactory(ctx, this);
        this.editNote = editNoteFactory(ctx, this);
        this.enableGroupLink = enableGroupLinkFactory(ctx, this);
        this.fetchAccountInfo = fetchAccountInfoFactory(ctx, this);
        this.findUser = findUserFactory(ctx, this);
        this.forwardMessage = forwardMessageFactory(ctx, this);
        this.getAliasList = getAliasListFactory(ctx, this);
        this.getAllFriends = getAllFriendsFactory(ctx, this);
        this.getPhoneBooks = getPhoneBookFactory(ctx, this);
        this.getAllGroups = getAllGroupsFactory(ctx, this);
        this.getAutoDeleteChat = getAutoDeleteChatFactory(ctx, this);
        this.getBizAccount = getBizAccountFactory(ctx, this);
        this.getCookie = getCookieFactory(ctx, this);
        this.getFriendRequest = getFriendRequestFactory(ctx, this);
        this.getGroupInfo = getGroupInfoFactory(ctx, this);
        this.getGroupMembersInfo = getGroupMembersInfoFactory(ctx, this);
        this.getHiddenConversPin = getHiddenConversPinFactory(ctx, this);
        this.getLabels = getLabelsFactory(ctx, this);
        this.getMute = getMuteFactory(ctx, this);
        this.getOwnId = getOwnIdFactory(ctx, this);
        this.getPollDetail = getPollDetailFactory(ctx, this);
        this.getContext = getContextFactory(ctx, this);
        this.getQR = getQRFactory(ctx, this);
        this.getQuickMessage = getQuickMessageFactory(ctx, this);
        this.getStickers = getStickersFactory(ctx, this);
        this.getStickersDetail = getStickersDetailFactory(ctx, this);
        this.getUnreadMark = getUnreadMarkFactory(ctx, this);
        this.getUserInfo = getUserInfoFactory(ctx, this);
        this.inviteUserToGroups = inviteUserToGroupsFactory(ctx, this);
        this.keepAlive = keepAliveFactory(ctx, this);
        this.lockPoll = lockPollFactory(ctx, this);
        this.parseLink = parseLinkFactory(ctx, this);
        this.pinConversations = pinConversationsFactory(ctx, this);
        this.removeFriendAlias = removeFriendAliasFactory(ctx, this);
        this.removeGroupDeputy = removeGroupDeputyFactory(ctx, this);
        this.removeHiddenConversPin = removeHiddenConversPinFactory(ctx, this);
        this.removeQuickMessage = removeQuickMessageFactory(ctx, this);
        this.removeUnreadMark = removeUnreadMarkFactory(ctx, this);
        this.removeUserFromGroup = removeUserFromGroupFactory(ctx, this);
        this.resetHiddenConversPin = resetHiddenConversPinFactory(ctx, this);
        this.sendCard = sendCardFactory(ctx, this);
        this.sendDeliveredEvent = sendDeliveredEventFactory(ctx, this);
        this.sendFriendRequest = sendFriendRequestFactory(ctx, this);
        this.sendLink = sendLinkFactory(ctx, this);
        this.sendMessage = sendMessageFactory(ctx, this);
        this.sendReport = sendReportFactory(ctx, this);
        this.sendSeenEvent = sendSeenEventFactory(ctx, this);
        this.sendSticker = sendStickerFactory(ctx, this);
        this.sendTypingEvent = sendTypingEventFactory(ctx, this);
        this.sendVideo = sendVideoFactory(ctx, this);
        this.sendVoice = sendVoiceFactory(ctx, this);
        this.setMute = setMuteFactory(ctx, this);
        this.unblockUser = unblockUserFactory(ctx, this);
        this.undo = undoFactory(ctx, this);
        this.updateAutoDeleteChat = updateAutoDeleteChatFactory(ctx, this);
        this.updateHiddenConversPin = updateHiddenConversPinFactory(ctx, this);
        this.updateGroupSettings = updateGroupSettingsFactory(ctx, this);
        this.updateLabels = updateLabelsFactory(ctx, this);
        this.updateLang = updateLangFactory(ctx, this);
        this.updateProfile = updateProfileFactory(ctx, this);
        this.updateSettings = updateSettingsFactory(ctx, this);
        this.updateQuickMessage = updateQuickMessageFactory(ctx, this);
        this.uploadAttachment = uploadAttachmentFactory(ctx, this);
        this.getLastMsg = getLastMsgFactory(ctx, this);
        this.getAvatar = getAvatarFactory(ctx, this);

        // todo
        this.getPersonalTodoVerify = getPersonalTodoVerifyFactory(ctx, this);
        this.createPersonalTodo = createPersonalTodoFactory(ctx, this);
        this.updatePersonalTodo = updatePersonalTodoFactory(ctx, this);
        this.getPersonalTodoDing = getPersonalTodoDingFactory(ctx, this);
        this.updateStatusPersonalTodo = updateStatusPersonalTodoFactory(ctx, this);
        this.deletePersonalTodo = deletePersonalTodoFactory(ctx, this);
        this.getPersonalTodoDetail = getPersonalTodoDetailFactory(ctx, this);

        // add new 25/05/2025
        this.getPersonalBoardPinList = getPersonalBoardPinListFactory(ctx, this);
        this.getGroupBoardPinList = getGroupBoardPinListFactory(ctx, this);
        this.getGroupBoardList = getGroupBoardListFactory(ctx, this);
        this.getListReminder = getListReminderFactory(ctx, this);
        this.getLinkGroup = getLinkGroupFactory(ctx, this);
        this.getPersonalizedStickers = getPersonalizedStickersFactory(ctx, this);
        this.getCategoryStickers = getCategoryStickersFactory(ctx, this);
        this.getCategoryStickersDetail = getCategoryStickersDetailFactory(ctx, this);
        this.getStickersSuggestion = getStickersSuggestionFactory(ctx, this);
        this.getCategoryStickersRecommended = getCategoryStickersRecommendedFactory(ctx, this);
        this.getSearchStickers = getSearchStickersFactory(ctx, this);
        this.getCategoryStickersDetailStick = getCategoryStickersDetailStickFactory(ctx, this);
        // add 03/06/2025
        this.getProfileExtra = getProfileExtraFactory(ctx, this);
        this.getLastOnline = getLastOnlineFactory(ctx, this);
        this.getFriendReqStatus = getFriendReqStatusFactory(ctx, this);
        this.undoFriendRequest = undoFriendRequestFactory(ctx, this);
        this.rejectFriendRequest = rejectFriendRequestFactory(ctx, this);

        this.custom = customFactory(ctx, this);
    }
}
export { API };
