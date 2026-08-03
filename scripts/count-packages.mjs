import mongoose from "mongoose";

const uri = "mongodb+srv://faizankhan1405_db_user:EbvpqIsIseOF8a14@cluster0.vn7wogr.mongodb.net/?appName=Cluster0";

async function main() {
  await mongoose.connect(uri, { dbName: "ezymiles" });
  const db = mongoose.connection.db;

  const packagesCollection = db.collection("packages");
  const total = await packagesCollection.countDocuments();
  const published = await packagesCollection.countDocuments({ status: "published" });

  const samples = await packagesCollection
    .find({}, { projection: { title: 1, slug: 1, destinationSlug: 1, status: 1, isDemoData: 1 } })
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();

  console.log("Total packages in DB:", total);
  console.log("Published packages:", published);
  console.log("\nAll packages:");
  for (const p of samples) {
    console.log(`  - [${p.status || "?"}] ${p.title}  (slug: ${p.slug}, dest: ${p.destinationSlug || "—"}${p.isDemoData ? ", demo" : ""})`);
  }

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
