const http = require("node:http");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const host = process.env.HOST || process.env.IP || "0.0.0.0";
const port = Number.parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname: host, port });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    http
      .createServer(async (req, res) => {
        try {
          await handle(req, res);
        } catch (error) {
          console.error("Unhandled request error", error);
          res.statusCode = 500;
          res.end("Internal Server Error");
        }
      })
      .listen(port, host, () => {
        console.log(`> Ready on http://${host}:${port}`);
      });
  })
  .catch((error) => {
    console.error("Failed to start the cPanel server", error);
    process.exit(1);
  });
