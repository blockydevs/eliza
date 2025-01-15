import type { Plugin } from "@elizaos/core";
import { createPost } from "./actions/create-post";
import {testAction} from "./actions/test-action";

export const linkedinPost: Plugin = {
    name: "Linkedin Plugin",
    description: "Linkedin integration plugin",
    providers: [],
    evaluators: [],
    services: [],
    actions: [createPost, testAction],
};

export default linkedinPost;
