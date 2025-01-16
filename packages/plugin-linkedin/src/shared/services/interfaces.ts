export interface UserInfo {
  sub: string;
  email_verified: boolean;
  name: string;
  locale: { country: string; language: string };
  given_name: string;
  family_name: string,
  email: string,
  picture?: string;
};

export interface MediaUploadUrl {  
  value: {
    uploadUrlExpiresAt: number,
    uploadUrl: string,
    image: string
  }
};

export interface BasePostRequest {
    author: string;
    commentary: string;
    visibility: "PUBLIC";
    distribution: {
        feedDistribution: "MAIN_FEED";
        targetEntities: never[];
        thirdPartyDistributionChannels: never[];
    };
    lifecycleState: "PUBLISHED";
    isReshareDisabledByAuthor: boolean;
}

export interface PostRequestWithMedia extends BasePostRequest {
    content?: {
        media: {
            title: string;
            id: string;
        };
    };
}

export const API_VERSION_HEADER = "LinkedIn-Version";
export const API_VERSION = "202411";