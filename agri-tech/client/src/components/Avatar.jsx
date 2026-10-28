// Initials avatar. Used instead of stock portraits so no real person's photo is attached to an account.
const TONES = ['#1f5d3a', '#6b4a2b', '#1d5f8f', '#7a3b22', '#4a6b1f', '#5b3f7a'];

const initialsOf = (name) => String(name || '?').split(/\s+/).filter((part) => /^[\p{L}]/u.test(part)).slice(0, 2).map((part) => part[0].toUpperCase()).join('') || '?';
const toneOf = (name) => TONES[[...String(name || '')].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % TONES.length];

export default function Avatar({ name, size = '2.6rem', className = '' }) {
  return (
    <span className={`avatar ${className}`} style={{ '--size': size, background: `linear-gradient(145deg, ${toneOf(name)}, #0f2f1e)` }} aria-hidden="true">
      {initialsOf(name)}
    </span>
  );
}
