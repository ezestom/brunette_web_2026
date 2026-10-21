// Keep the development JSX runtime separate from production builds.
process.env.NODE_ENV = "development";
process.argv.splice(2, 0, "dev", "--host", "127.0.0.1", "--port", "4321");
await import("../node_modules/astro/bin/astro.mjs");
