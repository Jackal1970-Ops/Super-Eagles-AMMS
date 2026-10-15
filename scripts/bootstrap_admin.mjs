import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function requireValue(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

async function main() {
  const email = requireValue("INITIAL_ADMIN_EMAIL").toLowerCase();
  const name = requireValue("INITIAL_ADMIN_NAME");
  const password = requireValue("INITIAL_ADMIN_PASSWORD");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new Error("INITIAL_ADMIN_EMAIL must be a valid email address.");
  }
  if (name.length > 200) throw new Error("INITIAL_ADMIN_NAME must be 200 characters or fewer.");
  if (password.length < 14 || password.length > 256) {
    throw new Error("INITIAL_ADMIN_PASSWORD must contain between 14 and 256 characters.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash, role: "SUPER_ADMIN", isActive: true },
    create: { email, name, passwordHash, role: "SUPER_ADMIN", isActive: true },
    select: { id: true, email: true, name: true, role: true },
  });

  console.log(`Production administrator ready: ${admin.email} (${admin.id})`);
}

main()
  .catch((error) => {
    console.error("Administrator bootstrap failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
