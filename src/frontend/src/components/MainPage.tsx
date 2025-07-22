import { FingerPrintIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import "./shared/styles.css";

interface MainPageProps {
  onLoginClick: () => void;
  isLoginLoading: boolean;
  onNavigateToAbout: () => void;
}

export default function MainPage({
  onLoginClick,
  isLoginLoading,
  onNavigateToAbout,
}: MainPageProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    const nav = document.querySelector(".main-nav");
    nav?.classList.toggle("active");
  };

  return (
    <div>
      {/* Header Section */}
      <header className="site-header">
        <div className="container">
          <div className="header-content">
            <div className="logo-container">
              <a href="/" className="logo-link" aria-label="SRV Home">
                <img src="/logo.svg" alt="SRV Logo" className="logo-image" />
              </a>
            </div>

            <button
              className={`mobile-menu-toggle ${isMobileMenuOpen ? "active" : ""}`}
              aria-label="Toggle menu"
              onClick={toggleMobileMenu}
            >
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
            </button>

            <nav className={`main-nav ${isMobileMenuOpen ? "active" : ""}`}>
              <ul className="nav-list">
                <li className="nav-item">
                  <a
                    href="#"
                    className="nav-link nav-link-active"
                    onClick={(e) => {
                      e.preventDefault();
                    }}
                  >
                    Home
                  </a>
                </li>
                <li className="nav-item">
                  <a
                    href="#"
                    className="nav-link"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigateToAbout();
                    }}
                  >
                    About
                  </a>
                </li>
                <li className="nav-item"></li>
                <li className="nav-item nav-cta">
                  <button
                    onClick={onLoginClick}
                    disabled={isLoginLoading}
                    className={"btn-primary"}
                  >
                    {isLoginLoading ? (
                      <>
                        <div className="mr-3 h-5 w-5 animate-spin rounded-full border-b-2 border-slate-800"></div>
                        <span>Connecting...</span>
                      </>
                    ) : (
                      <>
                        <FingerPrintIcon className="mr-3 h-6 w-6" />
                        <span>Login / Sign Up</span>
                      </>
                    )}
                  </button>
                </li>
              </ul>
            </nav>

            <div className="header-button">
              <button
                onClick={onLoginClick}
                disabled={isLoginLoading}
                className={"btn-primary"}
              >
                {isLoginLoading ? (
                  <>
                    <div className="mr-3 h-5 w-5 animate-spin rounded-full border-b-2 border-slate-800"></div>
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <FingerPrintIcon className="mr-3 h-6 w-6" />
                    <span>Login / Sign Up</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text-container">
              <h1 className="hero-text">
                <div className="text-line">
                  <span className="text-segment">Ang Serbisyo,</span>
                  <span className="component-group-after">
                    <span className="arrow-circle">
                      <img
                        src="/hero/arrow.png"
                        alt="Arrow"
                        className="arrow-image"
                      />
                    </span>
                    <span className="toggle-switch"></span>
                  </span>
                </div>

                <div className="text-line">
                  <span className="component-group-before">
                    <img
                      src="/hero/star.svg"
                      alt="star"
                      className="star-image"
                    />
                  </span>
                  <span className="text-segment">Rito ay</span>
                  <span className="component-group-after">
                    <img
                      src="/hero/message-load.svg"
                      alt="message-load"
                      className="message-load-image"
                    />
                  </span>
                </div>

                <div className="text-line">
                  <span className="component-group-before">
                    <div className="dots-line">
                      <span className="line"></span>
                      <span className="dots">
                        <span className="dot"></span>
                        <span className="dot"></span>
                      </span>
                      <span className="line"></span>
                    </div>
                  </span>

                  <span className="text-segment">always Valued!</span>
                  <span className="component-group-after">
                    <img
                      src="/hero/polygon1.svg"
                      alt="star"
                      className="polygon-image1"
                    />
                    <img
                      src="/hero/polygon1.svg"
                      alt="star"
                      className="polygon-image2"
                    />
                  </span>
                </div>
              </h1>
            </div>

            <p className="hero-description">
              Finding reliable help for everyday tasks can be a challenge.
              <strong>SRV</strong> is your platform to easily discover, compare,
              and book a wide range of local service providers.
            </p>

            <div className="hero-buttons">
              <button
                onClick={onLoginClick}
                disabled={isLoginLoading}
                className={"btn-primary"}
              >
                {isLoginLoading ? (
                  <>
                    <div className="mr-3 h-5 w-5 animate-spin rounded-full border-b-2 border-slate-800"></div>
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <FingerPrintIcon className="mr-3 h-6 w-6" />
                    <span>Login / Sign Up</span>
                  </>
                )}
              </button>
            </div>
            <div
              style={{
                marginTop: "20px",
                textAlign: "center",
                fontSize: "1rem",
                color: "#444",
              }}
            ></div>
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="container">
          <div className="features-header">
            <h1 className="features-title">How does SRV work?</h1>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <h3 className="feature-title">Discover</h3>
              <div className="feature-image">
                <img
                  src="public/blueBall.png"
                  alt="Service Discovery"
                  className="feature-icon"
                />
              </div>
              <p className="feature-description">
                Browse trusted service providers near you - from home repair to
                wellness.
              </p>
            </div>

            <div className="feature-card">
              <h3 className="feature-title">Compare</h3>
              <div className="feature-image">
                <img
                  src="public/ovalorange.png"
                  alt="Detailed Provider Profiles"
                  className="feature-icon"
                />
              </div>
              <p className="feature-description">
                Check profiles, ratings, and real customer reviews
              </p>
            </div>

            <div className="feature-card">
              <h3 className="feature-title">Book</h3>
              <div className="feature-image">
                <img
                  src="public/capsuleguy.png"
                  alt="Seamless Booking System"
                  className="feature-icon"
                />
              </div>
              <p className="feature-description">
                Choose your preferred provider and confirm your schedule in just
                a few taps
              </p>
            </div>

            <div className="feature-card">
              <h3 className="feature-title">Get it Done</h3>
              <div className="feature-image">
                <img
                  src="public/blueoval.png"
                  alt="Authentic Ratings & Reviews"
                  className="feature-icon"
                />
              </div>
              <p className="feature-description">
                Service is completed. You rate, review, and vouch - helping the
                next customer choose wisely
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="why-choose-section">
        <img
          src="public/CircleArrow.svg"
          className="bg-shape-arrow-left"
          alt=""
        />
        <img
          src="public/Polygon 3.svg"
          className="bg-shape-triangle-top"
          alt=""
        />

        <div className="container">
          <div className="why-choose-header">
            <div className="why-choose-title-container">
              <h1 className="why-choose-title">Why Choose SRV?</h1>
            </div>
          </div>

          <div className="why-choose-content">
            <div className="phone-container">
              <img
                src="public/phone-new.png"
                alt="SRV Mobile App"
                className="phone-image"
              />
            </div>

            <div className="content-card">
              <div className="reasons-grid">
                <div className="reason-item">
                  <div className="reason-icon">
                    <svg
                      className="icon-svg"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      ></path>
                    </svg>
                  </div>
                  <h3 className="reason-title">Beripikado at Maaasahan</h3>
                  <p className="reason-description">
                    Kasama mo ang SRV sa paghanap ng mga service provider na may
                    kakayahan at beripikado.
                  </p>
                </div>

                <div className="reason-item">
                  <div className="reason-icon">
                    <svg
                      className="icon-svg"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      ></path>
                    </svg>
                  </div>
                  <h3 className="reason-title">
                    Platform na Nakatuon sa Kliyente
                  </h3>
                  <p className="reason-description">
                    Madali lang maghanap at magtingin ng mga service provider sa
                    iyong partikular na pangangailangan at lokasyon
                  </p>
                </div>

                <div className="reason-item">
                  <div className="reason-icon">
                    <svg
                      className="icon-svg"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"
                      ></path>
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z"
                      ></path>
                    </svg>
                  </div>
                  <h3 className="reason-title">Nagpapalakas sa mga Provider</h3>
                  <p className="reason-description">
                    Lahat ng iskedyul, reputasyon at ng kakayahan mo, mabilis
                    lang asikasuhin sa SRV.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sdg-section">
        <div className="container">
          <div className="sdg-header">
            <h1 className="sdg-title">
              Our Commitment to Sustainable Development
            </h1>
            <p className="sdg-description">
              SRV is dedicated to making a positive impact by aligning our
              platform with key Sustainable Development Goals.
            </p>
          </div>

          <div className="sdg-grid">
            <div className="sdg-card">
              <h3 className="sdg-card-title">
                SDG 9: Industry, Innovation, and Infrastructure
              </h3>
              <div className="sdg-icon">
                <img src="public/sdg9.png" alt="sdg 9" />
              </div>

              <p className="sdg-card-description">
                Integrating blockchain into e-commerce brings innovation to a
                mature industry while promoting public adoption of the
                technology and strengthening the platform's infrastructure.
              </p>
            </div>

            <div className="sdg-card sdg-card-primary">
              <h3 className="sdg-card-title sdg-primary-title">
                SDG 8: Decent Work and Economic Growth
              </h3>
              <div className="sdg-icon">
                <img src="public/sdg8.png" alt="sdg 8" />
              </div>

              <p className="sdg-card-description sdg-primary-description">
                SRV provides a professional platform for service transactions,
                promoting mutual respect and creating job opportunities for
                skilled but unemployed individuals.
              </p>
              <div className="sdg-primary-badge">Primary Focus</div>
            </div>

            <div className="sdg-card">
              <h3 className="sdg-card-title">
                SDG 17: Partnerships for the Goals
              </h3>
              <div className="sdg-icon">
                <img src="public/sdg17.png" alt="sdg 17" />
              </div>

              <p className="sdg-card-description">
                SRV fosters collaboration among service providers, clients, and
                support staff through technology, aligning with the SDG goals of
                partnership and knowledge sharing.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-cta-section">
        <div className="container">
          <div className="about-cta-card">
            <h2 className="about-cta-title">Join the SRV Community Today</h2>
            <p className="about-cta-description">
              Connect with trusted local service providers and discover a better
              way to get things done in your community.
            </p>
            <div className="about-cta-button-container">
              <button
                onClick={onLoginClick}
                disabled={isLoginLoading}
                className={"btn-primary"}
              >
                {isLoginLoading ? (
                  <>
                    <div className="mr-3 h-5 w-5 animate-spin rounded-full border-b-2 border-slate-800"></div>
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <FingerPrintIcon className="mr-3 h-6 w-6" />
                    <span>Login / Sign Up</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <a href="/" className="footer-logo-link">
                <img
                  src="public/logo.svg"
                  alt="SRV Logo"
                  className="footer-logo"
                />
              </a>
            </div>
            <div className="footer-section footer-nav">
              <ul className="footer-links nav-links">
                <li className="nav-item">
                  <a
                    href="#"
                    className="footer-link"
                    onClick={(e) => {
                      e.preventDefault();
                    }}
                  >
                    Home
                  </a>
                </li>
                <li className="nav-item">
                  <a
                    href="#"
                    className="footer-link"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigateToAbout();
                    }}
                  >
                    About
                  </a>
                </li>
              </ul>
            </div>
            <div className="footer-section">
              <ul className="footer-links">
                <li className="social-item-main">
                  <a
                    href="https://www.facebook.com/srvpinoy"
                    className="footer-link social-link-main"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src="public/socials/brand-facebook.svg"
                      alt="Facebook"
                      className="social-icon-main"
                    />
                  </a>
                  <a
                    href="https://www.instagram.com/srvpinoy?igsh=MWJzZTEyaGFrdmwycw%3D%3D&utm_source=qr"
                    className="footer-link social-link-main"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src="public/socials/brand-instagram.svg"
                      alt="Instagram"
                      className="social-icon-main"
                    />
                  </a>
                  <a
                    href="https://youtube.com/@srvpinoy?si=XqCsNabtY42DkpJ-"
                    className="footer-link social-link-main"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src="public/socials/brand-youtube.svg"
                      alt="Youtube"
                      className="social-icon-main"
                    />
                  </a>
                  <a
                    href="https://www.tiktok.com/@srvpinoy?_t=ZS-8xkUDFeTRm3&_r=1"
                    className="footer-link social-link-main"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src="public/socials/brand-tiktok.svg"
                      alt="Tiktok"
                      className="social-icon-main"
                    />
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p className="footer-copyright">
              © 2025 SRV Service Booking. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
