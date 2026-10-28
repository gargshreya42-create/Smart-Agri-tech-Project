import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { homeFor } from '../components/ProtectedRoute';
import SmartImage from '../components/SmartImage';
import { GALLERY_CROPS, HERO, cropImage } from '../utils/images';

const FEATURE_ICONS = ['bi-cloud-sun', 'bi-layers', 'bi-bug', 'bi-flower2', 'bi-shop', 'bi-person-workspace', 'bi-people', 'bi-graph-up-arrow'];
const BENEFIT_ICONS = ['bi-flower3', 'bi-shield-check', 'bi-graph-up', 'bi-bar-chart-line', 'bi-cloud-sun', 'bi-bag-check', 'bi-person-check', 'bi-diagram-3'];

function HeroPhoto() {
  return (
    <div className="hero-photo">
      <SmartImage image={HERO} ratio="4 / 4.2" width={1100} sizes="(min-width: 992px) 36rem, 100vw" eager zoom={false} fallbackIcon="bi-tree" fallbackLabel="Farm photo unavailable" />
      <div className="hero-chip" style={{ left: '-0.4rem', top: '12%' }}><i className="bi bi-droplet-fill text-primary" aria-hidden="true" />Soil moisture 62%</div>
      <div className="hero-chip b" style={{ left: '1rem', bottom: '14%' }}><i className="bi bi-check-circle-fill text-success" aria-hidden="true" />Harvest in 18 days</div>
      <div className="hero-phone" aria-hidden="true">
        <div className="d-flex justify-content-between align-items-center mb-2"><span className="small fw-bold text-success">Today</span><i className="bi bi-bell-fill text-warning" /></div>
        <div className="rounded-3 text-white p-2 mb-2" style={{ background: 'linear-gradient(145deg,#1d5f8f,#3a86c8)' }}>
          <div className="d-flex align-items-center gap-2"><i className="bi bi-cloud-sun fs-4" /><span className="display-font fs-3 fw-bold">28°</span></div>
          <div className="small">Bhopal · 20% rain</div>
        </div>
        <div className="small fw-bold mb-1">Soil health</div>
        <div className="meter mb-2"><span style={{ width: '78%' }} /></div>
        <div className="d-flex gap-1 flex-wrap"><span className="tone tone-green"><i className="bi bi-flower2" />Wheat</span><span className="tone tone-amber"><i className="bi bi-bug" />Aphids</span></div>
      </div>
    </div>
  );
}

export default function Landing() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const primaryTo = user ? homeFor(user) : '/register';

  return (
    <>
      <section className="hero" id="top">
        <div className="container py-5">
          <div className="row align-items-center g-5 py-lg-4">
            <div className="col-lg-6">
              <span className="section-eyebrow"><i className="bi bi-stars me-1" />Smart Agri-Tech</span>
              <h1 className="mt-2 mb-3">{t('landing.heroLine1')}<br />{t('landing.heroLine2')}<br /><em>{t('landing.heroLine3')}</em></h1>
              <p className="lead text-muted mb-4" style={{ maxWidth: '34rem' }}>{t('landing.heroDesc')}</p>
              <div className="d-flex flex-wrap gap-3">
                <Link to={primaryTo} className="btn btn-primary btn-lg">{t('landing.getStarted')} <i className="bi bi-arrow-right ms-1" aria-hidden="true" /></Link>
                <a href="#features" className="btn btn-outline-primary btn-lg">{t('landing.exploreFeatures')}</a>
              </div>
              <ul className="list-inline mt-4 mb-0 text-muted small fw-bold">
                <li className="list-inline-item me-3"><i className="bi bi-translate text-primary me-1" />English · हिन्दी · मराठी</li>
                <li className="list-inline-item me-3"><i className="bi bi-phone text-primary me-1" />Works on any phone</li>
                <li className="list-inline-item"><i className="bi bi-gift text-primary me-1" />Free for farmers</li>
              </ul>
            </div>
            <div className="col-lg-6 pb-4"><HeroPhoto /></div>
          </div>
        </div>
      </section>

      <section className="section" id="features">
        <div className="container">
          <div className="text-center mb-5">
            <span className="section-eyebrow">{t('nav.features')}</span>
            <h2 className="mt-1">{t('landing.featuresTitle')}</h2>
            <p className="text-muted">{t('landing.featuresSub')}</p>
          </div>
          <div className="row g-4">
            {FEATURE_ICONS.map((icon, i) => (
              <div key={icon} className="col-12 col-sm-6 col-lg-3">
                <article className="feature-card">
                  <div className="icon-wrap"><i className={`bi ${icon}`} aria-hidden="true" /></div>
                  <h3 className="h5 mb-2">{t(`landing.f${i + 1}.title`)}</h3>
                  <p className="text-muted mb-0">{t(`landing.f${i + 1}.text`)}</p>
                </article>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section pt-0" aria-labelledby="crops-h">
        <div className="container">
          <div className="text-center mb-4">
            <span className="section-eyebrow">{t('nav.crops')}</span>
            <h2 id="crops-h" className="mt-1">Built for the crops Indian farmers grow</h2>
            <p className="text-muted">Track every stage from sowing to harvest — grains, pulses, cotton and vegetables.</p>
          </div>
          <div className="row g-3">
            {GALLERY_CROPS.map((name) => (
              <div key={name} className="col-6 col-md-4 col-lg-3">
                <div className="crop-tile">
                  <SmartImage image={cropImage(name)} ratio="4 / 3" sizes="(min-width: 992px) 16rem, 50vw" fallbackLabel={`${name} photo unavailable`} />
                  <span className="label">{name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section pt-0">
        <div className="container">
          <div className="text-center mb-5">
            <h2>{t('landing.howTitle')}</h2>
            <p className="text-muted">{t('landing.howSub')}</p>
          </div>
          <div className="row g-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="col-12 col-md-6 col-lg-4">
                <div className="step-card"><span className="num">{n}</span><div className="fw-bold fs-5 pt-1">{t(`landing.s${n}`)}</div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section band-dark">
        <div className="container">
          <h2 className="text-center mb-5">{t('landing.benefitsTitle')}</h2>
          <div className="row g-4">
            {BENEFIT_ICONS.map((icon, i) => (
              <div key={icon} className="col-12 col-sm-6 col-lg-3">
                <div className="benefit"><i className={`bi ${icon}`} aria-hidden="true" /><span className="fw-bold fs-6">{t(`landing.b${i + 1}`)}</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="about">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <span className="section-eyebrow">{t('nav.about')}</span>
              <h2 className="mt-1">{t('landing.aboutTitle')}</h2>
              <p className="text-muted fs-5">{t('landing.aboutText')}</p>
            </div>
            <div className="col-lg-6">
              <div className="row g-3 text-center">
                {[['bi-geo-alt-fill', '7-day', 'forecast per farm'], ['bi-translate', '3', 'languages'], ['bi-shield-lock-fill', 'JWT + bcrypt', 'secure sign-in'], ['bi-phone-fill', 'Mobile-first', 'responsive design']].map(([icon, big, small]) => (
                  <div key={big} className="col-6"><div className="card p-3 h-100"><i className={`bi ${icon} fs-2 text-primary`} aria-hidden="true" /><div className="display-font fs-4 fw-bold">{big}</div><div className="small text-muted">{small}</div></div></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-5">
        <div className="container">
          <div className="cta-panel">
            <h2 className="mb-2">{t('landing.ctaTitle')}</h2>
            <p className="mb-4 opacity-75">{t('landing.ctaDesc')}</p>
            <Link to={primaryTo} className="btn btn-sun btn-lg">{t('auth.createAccount')} <i className="bi bi-arrow-right ms-1" aria-hidden="true" /></Link>
          </div>
        </div>
      </section>
    </>
  );
}
