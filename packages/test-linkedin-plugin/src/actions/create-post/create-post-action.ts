

export class createPostAction {
    constructor() {

    }

    async execute(
        postText: string,
        imagePath: string,
    ): Promise<boolean> {
        console.log(`Here shold be LinkedIn posting handled: ${postText}, with imagePath: ${imagePath}`);
        return true;
    }
}
