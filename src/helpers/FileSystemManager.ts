import {
    create,
    mkdir,
    exists,
    BaseDirectory,
    type FileHandle,
} from '@tauri-apps/plugin-fs';

/**
 * Options for creating a file, requiring a base directory.
 * This ensures that any function using this type provides the necessary `baseDir`.
 */
export interface CreateFileOptions {
    baseDir: BaseDirectory;
}

/**
 * Creates a file, ensuring its parent directory exists by creating it if necessary.
 * This function is a wrapper around the tauri `create` function that adds
 * recursive directory creation.
 *
 * @param {string} filePath - The path to the file, relative to the base directory.
 *                           Can include non-existent parent directories.
 * @param {CreateFileOptions} options - Options object, must include `baseDir`.
 * @returns {Promise<FileHandle>} A promise that resolves to the file handle provided by Tauri.
 */
export const createFileEnsuringPath = async (
    filePath: string,
    options: CreateFileOptions
): Promise<FileHandle> => {
    // Find the last path separator to isolate the directory path
    const lastSeparatorIndex = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));

    // If a separator is found, it means there's a directory path to check
    if (lastSeparatorIndex !== -1) {
        const dirPath = filePath.substring(0, lastSeparatorIndex);

        // Check if the directory already exists
        const directoryExists = await exists(dirPath, { baseDir: options.baseDir });

        // If the directory does not exist, create it recursively
        if (!directoryExists) {
            console.log(`Directory "${dirPath}" does not exist. Creating...`);
            await mkdir(dirPath, { baseDir: options.baseDir, recursive: true });
            console.log(`Directory "${dirPath}" created successfully.`);
        }
    }

    // Now that the directory path is guaranteed to exist, create the file.
    // The `create` function will truncate the file if it already exists.
    console.log(`Creating file: "${filePath}"...`);
    const file = await create(filePath, options);
    console.log(`File "${filePath}" created successfully.`);
    return file;
};