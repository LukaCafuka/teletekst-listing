const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

// Define the port for the server
const PORT = 8908;

// Get the directory to serve from the command line argument, default to the current directory
const serveDirectory = process.argv[2] || process.cwd();

if (!fs.existsSync(serveDirectory) || !fs.lstatSync(serveDirectory).isDirectory()) {
    console.error("Error: Invalid directory specified.");
    process.exit(1);
}

// Function to generate the directory listing HTML
function generateDirectoryListing(directoryPath, currentUrl) {
    const files = fs.readdirSync(directoryPath, { withFileTypes: true });
    let html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Teletekst</title>
        <meta charset="UTF-8">   
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
            body {
                font-family: "Courier New";
                background-color: #121218;
                color: white;
                margin: auto 2rem auto 2rem;
            }

            ul li {
                list-style-type: none;
                position: relative;
                width: 100%;
                height: 20px;
                padding: 5px 0;
            }
            ul {
                padding: 0;
            }
            a:link {
                color: cyan;
            }
            
            ul a {
                width: 100%;
                height: 100%;
                position: absolute;
            }
            a:visited {
                color: #a69999;
            }
            .text-center {
                text-align: center;
            }
            .file:hover, .directory:hover {
                background-color: #3f3c3c;
            }
        </style>
    </head>
    <body>
        <h1>Arhiva Teleteksta</h1>
        <h2>Putanja: ${currentUrl}</h2>
        <p>Teletekstovi su generirani od programa na <a href="https://github.com/ali1234/vhs-teletext">ovoj poveznici</a></p>
        <p>Ispod se nalazi lista direktorija po kojima možete slobodno pretraživati sve dekodirane teletekstove. Svaki direktorij je imenovan po datumu originalnog uzorka za teletekst</p>
        <ul>
  `;

    // Add parent directory link
    if (currentUrl !== "/") {
        const parentDir = path.dirname(currentUrl);
        html += `<li><a href="${parentDir === "." ? "/" : parentDir}">..</a></li>`;
    }

    // List files and directories, excluding hidden ones (those starting with ".")
    files
        .filter((file) => !file.name.startsWith(".")) // Exclude hidden files
        .forEach((file) => {
            const isDirectory = file.isDirectory();
            const fileName = file.name;
            const href = path.join(currentUrl, fileName).replace(/\\/g, "/");
            html += `<li class="${isDirectory ? "directory" : "file"}"><a href="${href}">${fileName}${isDirectory ? "/" : ""}</a></li>`;
        });

    html += `
      </ul>
        <footer>
            <h5 class="text-center">Info: <a href="https://z.com.hr">z.com.hr</a></h5>
        </footer>
    </body>
    </html>
  `;

    return html;
}

// Create the HTTP server
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url);
    const decodePath = decodeURIComponent(parsedUrl.pathname);
    const filePath = path.join(serveDirectory, decodePath);

    // Check if the file/directory exists
    if (!fs.existsSync(filePath)) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=UTF-8" });
        res.end("404 Not Found | Resurs nije pronađen");
        return;
    }

    // Serve directory listing
    if (fs.lstatSync(filePath).isDirectory()) {
        const html = generateDirectoryListing(filePath, decodePath);
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(html);
        return;
    }

    // Serve static files
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
        ".html": "text/html",
        ".css": "text/css",
        ".js": "application/javascript",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".gif": "image/gif",
        ".txt": "text/plain",
        ".json": "application/json",
    };
    const contentType = mimeTypes[ext] || "application/octet-stream";

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(500, { "Content-Type": "text/plain" });
            res.end("500 Internal Server Error");
        } else {
            res.writeHead(200, { "Content-Type": contentType });
            res.end(content);
        }
    });
});

// Start the server
server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}/`);
    console.log(`Serving directory: ${serveDirectory}`);
});
