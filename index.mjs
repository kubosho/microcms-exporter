import fs from "fs/promises";
import path from 'path';
import { fileURLToPath } from 'url';

import { createClient } from 'microcms-js-sdk';
import ora from 'ora';

async function writeMarkdownFile(item) {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename)

        const { publishedAt, revisedAt, title, body, slug, categories, tags } = item;

        const mdBody = [
                `---`,
                `title: ${title}`,
                `categories: ${categories.join(",")}`,
                `tags: ${tags.join(",")}`,
                `publishedAt: ${publishedAt}`,
                `revisedAt: ${revisedAt}`,
                `---`,
                ``,
                `${body}`,
        ].join("\n");

        const date = new Date(publishedAt);
        const year = date.getUTCFullYear();

        const filePath = path.join(__dirname, `./outputs/${year}/${slug}.md`);
        const dirPath = path.dirname(filePath);

        try {
                await fs.mkdir(dirPath, { recursive: true });
        } catch (_err) {
                // do nothing
        }

        await fs.writeFile(
                filePath,
                mdBody,
                { flag: "wx" }
        );
}

async function main() {
        const microCmsFetchSpinner = ora('Fetching microCMS contents...');
        const markdownWriteSpinner = ora('Writing markdown files...');

        const client = createClient({
                apiKey: process.env.X_MICROCMS_API_KEY,
                serviceDomain: process.env.X_MICROCMS_API_SUB_DOMAIN,
        });


        const getAllContentsPromise = client.get({
                endpoint: process.env.X_MICROCMS_API_NAME,
                queries: { limit: 100 },
        });

        try {
                microCmsFetchSpinner.start();
                const res = await getAllContentsPromise;
                microCmsFetchSpinner.succeed('Fetching microCMS contents... Done');

                const { contents } = res;
                markdownWriteSpinner.start();
                await Promise.all(contents.map((item) => {
                        writeMarkdownFile(item);
                }));
                markdownWriteSpinner.succeed('Writing markdown files... Done');
        } catch (error) {
                markdownWriteSpinner.fail('Something went wrong... Failed');
                console.error(error);
        }
}

main();
