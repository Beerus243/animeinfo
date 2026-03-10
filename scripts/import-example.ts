import { connectToDatabase } from "@/lib/mongodb";
import { uploadRemoteImageToCloudinary } from "@/lib/cloudinary";
import { fetchRssFeed, getConfiguredRssSources } from "@/lib/rssParser";
import Article from "@/models/Article";

async function run() {
  const sources = getConfiguredRssSources();
  if (!sources.length) {
    throw new Error("No RSS_SOURCES configured.");
  }

  await connectToDatabase();

  let imported = 0;
  let enriched = 0;

  for (const source of sources) {
    const items = await fetchRssFeed(source);
    for (const item of items) {
      if (!item.originalUrl) {
        continue;
      }

      const existingArticle = await Article.findOne({ originalUrl: item.originalUrl })
        .select({ _id: 1, coverImage: 1, seo: 1 })
        .lean();

      if (existingArticle) {
        if (!existingArticle.coverImage && item.coverImage) {
          const mirroredCoverImage = await uploadRemoteImageToCloudinary(item.coverImage, item.slug);
          await Article.updateOne(
            { _id: existingArticle._id },
            {
              $set: {
                coverImage: mirroredCoverImage,
                "seo.ogImage": existingArticle.seo?.ogImage || mirroredCoverImage,
              },
            },
          );
          enriched += 1;
        }

        continue;
      }

      const mirroredCoverImage = await uploadRemoteImageToCloudinary(item.coverImage, item.slug);

      await Article.create({
        title: item.title,
        slug: item.slug,
        originalTitle: item.title,
        originalUrl: item.originalUrl,
        excerpt: item.excerpt,
        content: item.content,
        coverImage: mirroredCoverImage,
        sourceName: item.sourceName,
        status: "draft",
        seo: {
          metaTitle: item.title,
          metaDesc: item.excerpt,
          ogImage: mirroredCoverImage,
        },
      });

      imported += 1;
    }
  }

  console.log(JSON.stringify({ imported, enriched }, null, 2));
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });