import { AxiosInstance } from "axios";
import { BasePostRequest, PostRequestWithMedia, API_VERSION_HEADER, API_VERSION } from "./interfaces";

export class LinkedInPostPublisher {
  constructor(private readonly axios: AxiosInstance, readonly userId: string) {}

  async publishPost({
      postText, 
      media
  }: {
      postText: string,
      media?: {
          title: string,
          id: string
      }
  }) {
      const baseRequest: BasePostRequest = {
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
      };

      const requestBody: BasePostRequest | PostRequestWithMedia = media 
          ? { ...baseRequest, content: { media } }
          : baseRequest;

      await this.axios.post("/rest/posts", requestBody, {
          headers: {
              [API_VERSION_HEADER]: [API_VERSION],
          },
      });
  }
}