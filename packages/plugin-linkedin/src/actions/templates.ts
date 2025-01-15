export const linkedinPostTemplate = `Given the recent messages and cosmos wallet information below:
{{recentMessages}}
Extract the following information about the LinkedIn post:
1. **Post content**:
    - The post content must be a concise, coherent, and engaging string suitable for a LinkedIn post.
    - The post should be limited to the specified word count if provided. Otherwise, create a post with an optimal length for LinkedIn engagement (typically 50-200 words).

2. **Word count** (optional):
    - If a specific word count is mentioned in the prompt, ensure the post content adheres to this limit.

3. **Image** (optional):
    - If an image is requested, provide a description of the image that would be suitable for a LinkedIn post.

Respond with a JSON markdown block containing only the extracted values. All fields are required unless marked as optional:
\`\`\`json
{
    "postContent": string,
    "wordCount": number (optional),
    "imageDescription": string (optional)
}
\`\`\`

Example input: "Create a 50-word post about AI agents:"

Example response:
\`\`\`json
{
    "postContent": "AI agents are revolutionizing the digital landscape. They bring efficiency, automation, and personalized experiences to businesses and users alike. As web3 evolves, AI agents will play a pivotal role in shaping the next generation of the internet, driving innovation and unlocking new opportunities.",
    "wordCount": 50,
    "imageDescription": "A futuristic AI agent interacting with a human in a digital environment."
}
\`\`\`

Now respond with a JSON markdown block containing only the extracted values.
`;
