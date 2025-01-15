import { AxiosInstance } from "axios";

export class LinkedInApi {
    constructor(private readonly axios: AxiosInstance, readonly userId: string) {}

    async getUserInfo() {
        const response = await this.axios.get("/v2/userinfo");
        return response.data;
    }

    async createMediaUploadUrl() {
        const initResponse = await this.axios.post('/rest/images?action=initializeUpload', {
            initializeUploadRequest: {
                owner: `urn:li:person:${this.userId}`
            }
        }, {
            headers: {
                "LinkedIn-Version": "202407",
            },
        });

        return {
            uploadUrl: initResponse.data.value.uploadUrl,
            imageId: initResponse.data.value.image
        };
    }

    async uploadMedia(uploadUrl: string, imageBlob: Blob) {
        await this.axios.put(uploadUrl, imageBlob, {
            headers: {
                'Content-Type': 'application/octet-stream',
            }
        });
    }

    async uploadAsset(imageBlob: Blob) {
        const { uploadUrl, imageId } = await this.createMediaUploadUrl();
        await this.uploadMedia(uploadUrl, imageBlob);
        return imageId;
    }

    async publishPost({
        postText
    }: {
        postText: string
    }) {
        const response = await this.axios.post("/v2/posts", {
            author: `urn:li:person:${this.userId}`,
            commentary: postText,
            visibility: "PUBLIC",
            distribution: {
                feedDistribution: "MAIN_FEED",
                targetEntities: [],
                thirdPartyDistributionChannels: []
            },
            lifecycleState: "PUBLISHED",
            isReshareDisabledByAuthor: false
        }, {
            headers: {
                "X-Restli-Protocol-Version": "2.0.0",
            }
        });
        return response.data;
    }

    async publishPostWithMediaAsset({
        postText,
        media
    }: {
        postText: string,
        media: {
            title: string,
            id: string
        }
    }) {
        const response = await this.axios.post("/v2/posts", {
            author: `urn:li:person:${this.userId}`,
            commentary: postText,
            visibility: "PUBLIC",
            distribution: {
                feedDistribution: "MAIN_FEED",
                targetEntities: [],
                thirdPartyDistributionChannels: []
            },
            content: {
                media
            },
            lifecycleState: "PUBLISHED",
            isReshareDisabledByAuthor: false
        }, {
            headers: {
                "X-Restli-Protocol-Version": "2.0.0",
            }
        });
        return response.data;
    }
}
