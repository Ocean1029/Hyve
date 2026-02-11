declare module 'swagger-ui-dist' {
  interface SwaggerUIConfig {
    url?: string;
    dom_id: string;
    presets?: unknown[];
    plugins?: unknown[];
    layout?: string;
  }

  interface SwaggerUIBundleStatic {
    (config: SwaggerUIConfig): unknown;
    presets: { apis: unknown };
    plugins: { DownloadUrl: unknown };
  }

  export const SwaggerUIBundle: SwaggerUIBundleStatic;
  export const SwaggerUIStandalonePreset: unknown;
  export function getAbsoluteFSPath(): string;
}

declare module 'swagger-ui-dist/swagger-ui.css';
