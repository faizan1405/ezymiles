/**
 * Local verification helper only — spins up an ephemeral in-memory MongoDB and
 * prints its connection string. Not part of the shipped application; used to
 * smoke-test the app during development when no real MongoDB is available.
 */
const { MongoMemoryServer } = require("mongodb-memory-server");

(async () => {
  const mongod = await MongoMemoryServer.create({
    instance: { dbName: "ezymiles", port: 27117 },
  });
  const uri = mongod.getUri();
  console.log("MONGO_MEMORY_URI=" + uri);
  console.log("Memory server running. Press Ctrl+C to stop.");

  process.on("SIGINT", async () => {
    await mongod.stop();
    process.exit(0);
  });

  // Keep process alive.
  setInterval(() => {}, 1 << 30);
})();
