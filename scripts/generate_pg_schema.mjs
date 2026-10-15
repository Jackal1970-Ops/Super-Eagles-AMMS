import fs from "fs";

const schema = fs.readFileSync("prisma/schema.prisma", "utf8");
const pgSchema = schema.replace('provider = "sqlite"', 'provider = "postgresql"');
fs.writeFileSync("prisma/schema.postgresql.prisma", pgSchema, "utf8");
console.log("✓ PostgreSQL schema generated successfully at prisma/schema.postgresql.prisma");
