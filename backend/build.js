import fs from "fs";

if (fs.existsSync("dist")) {
    fs.rmSync("dist", { recursive: true, force: true });
}

fs.cpSync("src", "dist", { recursive: true });
console.log("Backend build completed: copied src/ to dist/.");
