export const createPostTemplate = `
Given the recent messages, especially generated image, its path, and connected LinkedIn account:
{{recentMessages}}
{{linkedinAccount}}
Prepare text for the requested LinkedIn post. Be engaging, relevant, and professional.

Respond with a JSON markdown block containing only the extracted values:
\`\`\`json
{
    "text": "Write your crafted LinkedIn post text here.", // example string
    "imagePath": "https://image.tmdb.org/t/p/original/original.png", //example string with url to image
}
\`\`\`
`;

