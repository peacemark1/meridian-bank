// Bigger diagnostic: complete TLS + startup and read the server's auth reply.
const tls = require("tls");
const net = require("net");

const host = "dpg-dbj975nb9u1s73dcpmlg-a.oregon-postgres.render.com";
const port = 5432;

const socket = net.connect({ host, port }, () => {
  socket.write(Buffer.from([0, 0, 0, 8, 0x04, 0xd2, 0x16, 0x2f])); // SSLRequest
});
socket.on("data", (d) => {
  const s = tls.connect({ socket, host, servername: host, rejectUnauthorized: false }, () => {
    const params = Buffer.from("user\0meridian_bank_pg_user\0database\0meridian_bank_pg\0\0", "utf8");
    const len = 8 + params.length;
    const msg = Buffer.alloc(len);
    msg.writeInt32BE(len, 0);
    msg.writeInt32BE(196608, 4);
    params.copy(msg, 8);
    s.write(msg);
  });
  let total = 0;
  s.on("data", (d) => {
    total += d.length;
    console.log("got", d.length, "bytes:", JSON.stringify(d.toString("latin1", 0, Math.min(140, d.length))));
    if (total > 200) { s.end(); process.exit(0); }
  });
  s.on("error", (e) => { console.log("tls error:", e.message); process.exit(1); });
  s.setTimeout(20000, () => { console.log("no startup reply within 20s; total", total); process.exit(0); });
});
socket.on("error", (e) => { console.log("tcp error:", e.message); process.exit(1); });
