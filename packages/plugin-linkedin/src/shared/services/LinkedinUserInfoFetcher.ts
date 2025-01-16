import { AxiosInstance } from "axios";
import { UserInfo } from "./interfaces";

export class LinkedInUserInfoFetcher {
  constructor(private readonly axios: AxiosInstance) {}

  async getUserInfo() {
      const response = await this.axios.get<UserInfo>("/v2/userinfo");
      return response.data;
  }
}
