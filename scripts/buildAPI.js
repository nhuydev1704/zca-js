import fs from "fs";
import path from "path";

const apisDir = path.join(process.cwd(), "src", "apis");
const outputFile = path.join(process.cwd(), "src", "apis.ts");

function getAllApiFiles(dir) {
    const ignoreFiles = ["listen.ts", "login.ts", "loginQR.ts", "custom.ts"];
    const files = [];

    const getFiles = (targetDir, subDir = "") => {
        fs.readdirSync(targetDir)
            .filter((file) => file.endsWith(".ts") && !ignoreFiles.includes(file))
            .forEach((file) => {
                const nonExtension = file.replace(/\.ts$/, "");
                files.push({
                    name: nonExtension,
                    factoryName: `${nonExtension}Factory`,
                    relativePath: subDir ? `${subDir}/${nonExtension}` : nonExtension,
                });
            });
    };

    // root
    getFiles(dir);

    // custom
    const customDir = path.join(dir, "custom");
    if (fs.existsSync(customDir) && fs.statSync(customDir).isDirectory()) {
        getFiles(customDir, "custom");
    }

    // stickers
    const stickersDir = path.join(dir, "stickers");
    if (fs.existsSync(stickersDir) && fs.statSync(stickersDir).isDirectory()) {
        getFiles(stickersDir, "stickers");
    }

    // group
    const groupDir = path.join(dir, "group");
    if (fs.existsSync(groupDir) && fs.statSync(groupDir).isDirectory()) {
        getFiles(groupDir, "group");
    }

    // personal
    const personalDir = path.join(dir, "personal");
    if (fs.existsSync(personalDir) && fs.statSync(personalDir).isDirectory()) {
        getFiles(personalDir, "personal");
    }

    return files;
}
function generateAPIsFile() {
    const allApiFiles = getAllApiFiles(apisDir);

    const importLines = allApiFiles.map((file) => {
        return `import { ${file.factoryName} } from "./apis/${file.relativePath}.js";`;
    });

    const propertyLines = allApiFiles.map((file) => {
        return `    public ${file.name}: ReturnType<typeof ${file.factoryName}>;`;
    });

    const constructorLines = allApiFiles.map((file) => {
        return `        this.${file.name} = ${file.factoryName}(ctx, this);`;
    });

    const emptyNewLine = "\n";

    const content =
        "" +
        'import { Listener } from "./apis/listen.js";\n' +
        emptyNewLine +
        importLines.join("\n") +
        emptyNewLine +
        'import { customFactory } from "./apis/custom.js";\n' +
        'import type { ZPWServiceMap, ContextSession } from "./context.js";\n' +
        emptyNewLine +
        "export class API {\n" +
        "    public zpwServiceMap: ZPWServiceMap;\n" +
        "    public listener: Listener;\n" +
        emptyNewLine +
        propertyLines.join("\n") +
        emptyNewLine +
        emptyNewLine +
        "    public custom: ReturnType<typeof customFactory>;\n" +
        emptyNewLine +
        "    constructor(ctx: ContextSession, zpwServiceMap: ZPWServiceMap, wsUrls: string[]) {\n" +
        "        this.zpwServiceMap = zpwServiceMap;\n" +
        "        this.listener = new Listener(ctx, wsUrls);\n" +
        emptyNewLine +
        constructorLines.join("\n") +
        emptyNewLine +
        emptyNewLine +
        "        this.custom = customFactory(ctx, this);\n" +
        "    }\n" +
        "}\n";

    fs.writeFileSync(outputFile, content, "utf-8");
    console.log(`\nAPIs file generated at ${outputFile}\n`);
}

generateAPIsFile();
