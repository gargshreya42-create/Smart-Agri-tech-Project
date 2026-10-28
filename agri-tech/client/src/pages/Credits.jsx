import { Link } from 'react-router-dom';
import { allImages, commonsPage } from '../utils/images';

const titleOf = (file) => file.replace(/\.[a-z0-9]+$/i, '').replace(/_/g, ' ');

export default function Credits() {
  const images = allImages().sort((a, b) => a.file.localeCompare(b.file));
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: '56rem' }}>
        <Link to="/" className="fw-bold text-decoration-none d-inline-block mb-3"><i className="bi bi-arrow-left me-1" aria-hidden="true" />Back to home</Link>
        <h1 className="mb-2">Photo credits</h1>
        <p className="text-muted fs-5">
          The photographs in Smart Agri-Tech come from <a href="https://commons.wikimedia.org" target="_blank" rel="noreferrer">Wikimedia Commons</a>, where
          each file is shared by its photographer under an open licence. Every page below shows the author and the exact licence terms for that photo.
        </p>
        <div className="card section-card mt-4">
          <ul className="list-unstyled mb-0 d-grid gap-2">
            {images.map((image) => (
              <li key={image.file} className="d-flex flex-wrap justify-content-between gap-2 border-bottom pb-2">
                <span className="fw-semibold">{titleOf(image.file)}</span>
                <a href={commonsPage(image.file)} target="_blank" rel="noreferrer" className="small fw-bold">Author &amp; licence <i className="bi bi-box-arrow-up-right" aria-hidden="true" /></a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
