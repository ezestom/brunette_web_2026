process.env.NODE_ENV = "production";
process.env.HOST ||= "0.0.0.0";
process.env.PORT ||= "4321";
await import("../dist/server/entry.mjs");
