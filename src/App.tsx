import { useRef } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { flowField } from './demo/flowField';
import { useElementSize } from './lib/useElementSize';
import { useP5Sketch } from './p5/useP5Sketch';

export default function App() {
  const stage = useElementSize<HTMLDivElement>();
  const host = useRef<HTMLDivElement | null>(null);
  useP5Sketch(host, flowField(() => stage.size), [stage.size.width, stage.size.height]);

  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div className="grid h-dvh place-items-center p-6 text-center">
          <p className="text-sm">{error.message}</p>

          <button
            type="button"
            onClick={reset}
            className="mt-3 rounded-md border border-line bg-raised px-3 py-1.5 text-sm"
          >
            Try again
          </button>

        </div>
      )}
    >
      <div ref={stage.ref} className="h-dvh w-screen overflow-hidden bg-bg">
        <div ref={host} className="h-full w-full" />
      </div>

    </ErrorBoundary>
  );
}
