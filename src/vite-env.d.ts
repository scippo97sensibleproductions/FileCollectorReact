/// <reference types="vite/client" />

interface ViteTypeOptions {
    // By adding this line, you can make the type of ImportMetaEnv strict
    // to disallow unknown keys.
    // strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
    readonly VITE_GITIGNORE_PATH: string
    readonly VITE_FILE_BASE_PATH: string
    readonly VITE_SYSTEM_PROMPTS_PATH: string
    readonly VITE_CONTEXTS_PATH: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}