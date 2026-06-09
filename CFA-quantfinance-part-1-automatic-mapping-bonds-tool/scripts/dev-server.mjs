import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { execFile } from "node:child_process";

const root = process.cwd();
const appDir = join(root, "app");
const port = Number(process.env.PORT || 4173);
const host = "127.0.0.1";

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8"
};

function resolvePath(url) {
  const requestedPath = new URL(url, `http://localhost:${port}`).pathname;
  const filePath = requestedPath === "/" ? "/index.html" : requestedPath;
  const normalized = normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, "");
  return join(appDir, normalized);
}

const server = createServer(async (request, response) => {
  try {
    const filePath = resolvePath(request.url || "/");
    const body = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": contentTypes[extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0"
    });
    response.end(body);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

server.listen(port, host, () => {
  const url = `http://${host}:${port}`;
  console.log(`Sovereign Bond Screening Tool preview is running at ${url}`);
  console.log("Press Ctrl+C to stop the preview server.");

  if (process.platform === "darwin" && process.env.NO_OPEN !== "1") {
    execFile("open", [url], () => {});
  }
});
