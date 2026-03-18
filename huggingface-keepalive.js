// [task_local]
// Huggingface Space保活
// 0 3 * * * huggingface-keepalive.js, tag=Huggingface Space保活, enabled=true

const fetch = require('node-fetch');

const huggingfaceOwner = process.env.HUGGINGFACE_OWNER;
const huggingfaceSpaceList = process.env.HUGGINGFACE_SPACE_LIST;

async function main() {
    if (!huggingfaceOwner || !huggingfaceSpaceList) {
        console.error("Huggingface owner or space list not set");
        return;
    }

    const spaceList = JSON.parse(huggingfaceSpaceList);
    for (const spaceName of spaceList) {
        const spaceUrl = `https://${huggingfaceOwner}-${spaceName}.hf.space`;
        try {
            await fetch(spaceUrl);
            console.log(`Successfully pinged ${spaceName}`);
        } catch (error) {
            console.error(`Error pinging ${spaceName}:`, error);
        }
    }
}

main().then();
