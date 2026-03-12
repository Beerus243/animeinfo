import { importConfiguredAnimeFeeds } from "@/lib/animeFeedImport";
import { connectToDatabase } from "@/lib/mongodb";

async function run() {
  await connectToDatabase();

  const animeImport = await importConfiguredAnimeFeeds();
  console.log(JSON.stringify(animeImport, null, 2));
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });