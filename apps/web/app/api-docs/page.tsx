'use client';

import { useEffect, useRef } from 'react';

/**
 * Uses swagger-ui-dist (vanilla JS) instead of swagger-ui-react to avoid
 * UNSAFE_componentWillReceiveProps warnings in React strict mode.
 */
export default function SwaggerPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function init() {
      const { SwaggerUIBundle, SwaggerUIStandalonePreset } = await import(
        'swagger-ui-dist'
      );
      await import('swagger-ui-dist/swagger-ui.css');

      if (!containerRef.current) return;

      containerRef.current.innerHTML = '';
      const el = document.createElement('div');
      el.id = 'swagger-ui-root';
      containerRef.current.appendChild(el);

      const Bundle = SwaggerUIBundle as {
        (config: object): unknown;
        presets: { apis: unknown };
        plugins: { DownloadUrl: unknown };
      };

      Bundle({
        url: '/api/swagger.json',
        dom_id: '#swagger-ui-root',
        presets: [Bundle.presets.apis, SwaggerUIStandalonePreset],
        plugins: [Bundle.plugins.DownloadUrl],
        layout: 'StandaloneLayout',
      });
    }

    init();

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div ref={containerRef} />
    </div>
  );
}
