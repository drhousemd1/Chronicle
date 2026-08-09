/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CHRONICLE_APPLICATION_VERSION?: string;
  readonly VITE_CHRONICLE_SOURCE_REVISION?: string;
  readonly VITE_CHRONICLE_SOURCE_FINGERPRINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
