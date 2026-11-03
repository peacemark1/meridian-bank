// Dev helper: mint a session cookie for a given email (local testing only).
const { createHmac } = require("crypto");
const fs = require("fs");
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

const secret = fs.readFileSync(".env", "utf8").match(/^AUTH_SECRET=(.*)$/m)[1].trim();
const email = process.argv[2] || "eulalopez01@gmail.com";

(async () => {
  const u = await db.user.findUnique({ where: { email } });
  if (!u) { console.error("not found:", email); process.exit(1); }
  const body = Buffer.from(JSON.stringify({
    userId: u.id,
    role: u.role,
    exp: Math.floor(Date.now() / 1000) + 3600,
  })).toString("base64url");
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  fs.writeFileSync(process.env.TEMP + "/eula-cookie.txt", `${u.name}|${u.currency}|` + body + "." + sig);
  console.log("minted for:", u.name, "currency:", u.currency);
  await db.$disconnect();
})();
