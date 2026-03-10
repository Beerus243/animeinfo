import { connectToDatabase } from "@/lib/mongodb";
import { uploadRemoteImageToCloudinary } from "@/lib/cloudinary";
import Article from "@/models/Article";

async function run() {
  await connectToDatabase();

  const articles = await Article.find({
    coverImage: {
      $exists: true,
      $type: "string",
      $ne: "",
      $regex: /^https?:\/\//i,
      $not: /res\.cloudinary\.com/i,
    },
  })
    .select({ _id: 1, slug: 1, title: 1, coverImage: 1, seo: 1 })
    .lean();

  let migrated = 0;
  let unchanged = 0;
  let failed = 0;

  for (const article of articles) {
    try {
      const nextCoverImage = await uploadRemoteImageToCloudinary(article.coverImage, article.slug);

      if (!nextCoverImage || nextCoverImage === article.coverImage) {
        unchanged += 1;
        continue;
      }

      const nextSeo = {
        ...(article.seo || {}),
        ogImage:
          !article.seo?.ogImage || article.seo.ogImage === article.coverImage
            ? nextCoverImage
            : article.seo.ogImage,
      };

      await Article.updateOne(
        { _id: article._id },
        {
          $set: {
            coverImage: nextCoverImage,
            seo: nextSeo,
          },
        },
      );

      migrated += 1;
    } catch {
      failed += 1;
    }
  }

  console.log(JSON.stringify({
    scanned: articles.length,
    migrated,
    unchanged,
    failed,
  }, null, 2));
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });