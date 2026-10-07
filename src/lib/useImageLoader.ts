import { useCallback, useEffect, useRef, useState } from 'react';
import { MAX_UPLOAD_BYTES } from './imageAnalysis';

export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
export const ACCEPTED_ATTR = ACCEPTED_TYPES.join(',');

export interface ImageLoader {
  readonly file: File | null;
  readonly sourceKey: string;
  readonly error: string | null;
  readonly dragging: boolean;
  openPicker: () => void;
  dropHandlers: {
    onDragEnter: () => void;
    onDragOver: (event: { preventDefault: () => void }) => void;
    onDragLeave: () => void;
    onDrop: (event: { preventDefault: () => void; dataTransfer: DataTransfer }) => void;
  };
  inputProps: {
    ref: React.RefObject<HTMLInputElement | null>;
    type: 'file';
    accept: string;
    className: string;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  };
}

export function useImageLoader(): ImageLoader {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);

  const accept = useCallback((candidate: File) => {
    setError(null);

    if (!ACCEPTED_TYPES.includes(candidate.type)) {
      setError('Use a JPEG, PNG, WebP, or AVIF file.');
      return;
    }
    if (candidate.size > MAX_UPLOAD_BYTES) {
      setError('That file is over 25 MB. Try a smaller copy.');
      return;
    }

    setFile(candidate);
  }, []);

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const pasted = Array.from(event.clipboardData?.files ?? [])[0];
      if (pasted) accept(pasted);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [accept]);
  const openPicker = useCallback(() => inputRef.current?.click(), []);

  const onChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const chosen = event.target.files?.[0];
      if (chosen) accept(chosen);
      event.target.value = '';
    },
    [accept],
  );

  const sourceKey =
    file === null ? 'empty' : `${file.name}:${file.size}:${file.lastModified}`;

  return {
    file,
    sourceKey,
    error,
    dragging,
    openPicker,
    dropHandlers: {
      onDragEnter: () => {
        dragDepth.current += 1;
        setDragging(true);
      },
      onDragOver: (event) => {
        event.preventDefault();
      },
      onDragLeave: () => {
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (dragDepth.current === 0) setDragging(false);
      },
      onDrop: (event) => {
        event.preventDefault();
        dragDepth.current = 0;
        setDragging(false);
        const dropped = event.dataTransfer.files[0];
        if (dropped) accept(dropped);
      },
    },
    inputProps: {
      ref: inputRef,
      type: 'file',
      accept: ACCEPTED_ATTR,
      className: 'sr-only',
      onChange,
    },
  };
}
