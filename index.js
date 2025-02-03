#!/usr/bin/node
import fs from "fs/promises";
import Path from "path";
import readline from "node:readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function getFileExtensions(dir) {
  const files = await fs.readdir(dir);
  const fileTypes = {};

  for (const file of files) {
    const filePath = Path.join(dir, file);

    try {
      const stats = await fs.stat(filePath);
      if (stats.isFile()) {
        const extType = Path.extname(file).toLowerCase() || ".noext";
        if (!fileTypes[extType]) {
          fileTypes[extType] = [];
        }
        fileTypes[extType].push(filePath);
      }
    } catch (err) {
      console.log(
        `Skipping ${filePath}... Probably a broken file/symlink: ${err.message}`
      );
    }
  }
  return fileTypes;
}

const createFolderWithExt = async (fileTypes, dir) => {
  for (const [extension, filePaths] of Object.entries(fileTypes)) {
    const newFolder = extension.startsWith(".") ? extension.slice(1) : "noext";
    const newFolderPath = Path.join(dir, newFolder);

    try {
      await fs.mkdir(newFolderPath, { recursive: true });
    } catch (err) {
      console.error(`Error creating folder ${newFolderPath}: ${err.message}`);
      continue; // Skip to the next extension
    }

    for (const file of filePaths) {
      const fileName = Path.basename(file);
      let newPath = Path.join(newFolderPath, fileName);
      let i = 1;

      while (
        await fs
          .access(newPath)
          .then(() => true)
          .catch(() => false)
      ) {
        const ext = Path.extname(fileName);
        const base = Path.basename(fileName, ext);
        newPath = Path.join(newFolderPath, `${base}(${i})${ext}`);
        i++;
      }

      try {
        await fs.rename(file, newPath);
        console.log(`${fileName} moved to ${newFolder}`);
      } catch (err) {
        console.error(
          `Error moving file: ${file} -> ${newPath}: ${err.message}`
        );
      }
    }
  }
};

const checkFileType = async (dir) => {
  try {
    const fileTypes = await getFileExtensions(dir);
    await createFolderWithExt(fileTypes, dir);
  } catch (err) {
    console.error("Error:", err.message);
  }
};

const getFilePathFromUser = async () => {
  rl.question("Please enter the filepath: ", async (userFilepath) => {
    const filepath = userFilepath.trim() || process.cwd();
    await checkFileType(filepath);
    rl.close();
  });
};

getFilePathFromUser();
