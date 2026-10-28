import { useEffect, useRef, useState } from 'react';
import { commonsUrl } from '../utils/images';

const SMALL = 480;

// { file } entries come from Wikimedia Commons (resized by width); { src } entries are admin-supplied URLs.
const urlFor = (image, width) => (image.src ? image.src : commonsUrl(image.file, width));
const keyOf = (image) => (image ? image.src || image.file : '');

function useImageState(image) {
  const ref = useRef(null);
  const [state, setState] = useState(image ? 'loading' : 'error');

  useEffect(() => {
    if (!image) { setState('error'); return; }
    const el = ref.current;
    // A cached image can finish loading before React attaches onLoad.
    if (el && el.complete) setState(el.naturalWidth > 0 ? 'loaded' : 'error');
    else setState('loading');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyOf(image)]);

  return { ref, state, onLoad: () => setState('loaded'), onError: () => setState('error') };
}

/**
 * Photo with a fixed aspect ratio, lazy loading, responsive sizes, a loading shimmer and a clean
 * agricultural fallback panel if the picture cannot be loaded (never a broken-image icon).
 */
export default function SmartImage({
  image, ratio = '4 / 3', width = 960, sizes = '(min-width: 992px) 33vw, 100vw', eager = false, zoom = true, decorative = false,
  fallbackIcon = 'bi-flower2', fallbackLabel = 'Photo unavailable', className = '', style, children,
}) {
  const { ref, state, onLoad, onError } = useImageState(image);
  const showImg = image && state !== 'error';

  return (
    <div className={`img-frame ${zoom ? 'img-zoom' : ''} ${className}`} style={{ aspectRatio: ratio, ...style }} data-state={state}>
      {showImg && (
        <img
          ref={ref}
          src={urlFor(image, width)}
          srcSet={image.src ? undefined : `${urlFor(image, SMALL)} ${SMALL}w, ${urlFor(image, width)} ${width}w`}
          sizes={image.src ? undefined : sizes}
          alt={decorative ? '' : image.alt}
          aria-hidden={decorative ? 'true' : undefined}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          fetchpriority={eager ? 'high' : undefined}
          referrerPolicy="no-referrer"
          style={image.position ? { objectPosition: image.position } : undefined}
          onLoad={onLoad}
          onError={onError}
        />
      )}
      {state === 'loading' && <span className="img-shimmer skeleton" aria-hidden="true" />}
      {state === 'error' && (
        <div className="img-fallback" role="img" aria-label={fallbackLabel}>
          <i className={`bi ${fallbackIcon}`} aria-hidden="true" />
          <span>{fallbackLabel}</span>
        </div>
      )}
      {children}
    </div>
  );
}

/**
 * Photo behind a banner or panel. The parent needs the `has-backdrop` class; if the photo fails to load
 * nothing is drawn and the parent's own gradient shows, so text stays readable either way.
 */
export function BackdropImage({ image, width = 1400, eager = false, strength = 'medium' }) {
  const { ref, state, onLoad, onError } = useImageState(image);
  if (!image || state === 'error') return null;
  return (
    <>
      <img
        ref={ref}
        className={`backdrop-img ${state === 'loaded' ? 'is-loaded' : ''}`}
        src={urlFor(image, width)}
        alt=""
        aria-hidden="true"
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        referrerPolicy="no-referrer"
        style={image.position ? { objectPosition: image.position } : undefined}
        onLoad={onLoad}
        onError={onError}
      />
      {state === 'loaded' && <span className={`backdrop-overlay ${strength}`} aria-hidden="true" />}
    </>
  );
}

/** Small square photo for admin tables. */
export function Thumb({ image, label = 'Photo unavailable', icon = 'bi-image' }) {
  return <SmartImage image={image} ratio="1 / 1" width={160} sizes="2.75rem" zoom={false} className="img-thumb" fallbackIcon={icon} fallbackLabel={label} />;
}
