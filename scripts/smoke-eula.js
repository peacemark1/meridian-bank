// Dev smoke helper: fetch authenticated pages with a minted cookie and check
// markers. Usage: node scripts/smoke-eula.js <token> <path> <marker>*
const http = require("http");

function get(path) {
  return new Promise((resolve, reject) => {
    http
      .get(
        { host: "localhost", port: 3000, path, headers: { Cookie: "meridian_session=" + process.argv[2] } },
        (res) => {
          let d = "";
          res.on("data", (c) => (d += c));
          res.on("end", () => resolve(d));
        },
      )
      .on("error", reject);
  });
}

(async () => {
  const path = process.argv[3];
  const markers = process.argv.slice(4);
  const html = await get(path);
  console.log("page:", path, "status ok, len:", html.length);
  for (const m of markers) {
    const negated = m.startsWith("!");
    const marker = negated ? m.slice(1) : m;
    console.log(`  ${marker}: ${negated ? !html.includes(marker) : html.includes(marker)}`);
  }
})();
