import { FingerPrintIcon } from "@heroicons/react/24/solid";

interface HeroProps {
  onLoginClick: () => void;
  isLoginLoading: boolean;
}

export default function Hero({ onLoginClick, isLoginLoading }: HeroProps) {
  const styles = `
    @font-face {
      font-family: 'rubik';
      src: url('/fonts/rubik.ttf') format('opentype');
    }

    .hero-text-container {
      position: relative;
      width: 100%;
      max-width: 1300px;
      margin: 0 auto;
      padding: 2rem;
      overflow: hidden;
    }

    .hero-text {
      font-family: 'rubik';
      font-size: 5.5rem;
      font-weight: 700;
      line-height: 1.1;
      color: #000;
      display: block;
      text-align: center;
      max-width: 1200px;
      margin: 0 auto;
    }

    .text-line {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 0.5rem;
      flex-wrap: wrap;
    }

    .text-segment {
      margin-right: 1rem;
      display: inline-block;
      white-space: nowrap;
    }

    .component-group {
      display: inline-flex;
      align-items: center;
      margin: 0 1rem;
      height: 5rem;
      position: relative;
    }

    .line-1-components {
      transform: translate(20px, -10px);
    }

    .line-2-components {
      transform: translate(-10px, 5px);
    }

    .line-3-components {
      transform: translate(50px, -15px);
    }

    .star {
      width: 5rem;
      height: 5rem;
      background: #FFD700;
      clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
      display: inline-block;
      animation: twinkle 2s ease-in-out infinite alternate;
    }

    .arrow-circle {
      width: 6rem;
      height: 6rem;
      background: linear-gradient(45deg, #FFDB6F, #f4c141);
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-right: 10px;
      animation: pulse 2s ease-in-out infinite;
    }

    .message-load-image {
      width: 20rem;
      transform: translate(10px, 10px);
      animation: message-typing 2.5s ease-in-out infinite;
      max-width: 100%;
    }

    .arrow-image {
      width: 3rem;
      height: 3rem;
      object-fit: contain;
    }

    .polygon-image1 {
      animation: dance1 4s ease-in-out infinite;
    }

    .polygon-image2 {
      animation: dance2 4s ease-in-out infinite;
    }

    .toggle-switch {
      width: 9rem;
      height: 6rem;
      background: linear-gradient(90deg, #1984CE, #FFDB6F);
      border-radius: 60px;
      position: relative;
      display: inline-block;
      box-shadow: 0 0 15px rgba(25, 132, 206, 0.4);
      animation: pulse-shadow 3s infinite alternate;
    }

    .toggle-switch::after {
      content: '';
      position: absolute;
      right: 4px;
      top: 4px;
      width: 5.5rem;
      height: 5.5rem;
      background: white;
      border-radius: 50%;
      transition: transform 0.3s ease;
      animation: slide-toggle 6s infinite alternate;
    }

    .dots-line {
      display: inline-flex;
      align-items: center;
      margin-right: 2rem;
      transform: none;
    }

    .line {
      width: 80px;
      height: 3.5px;
      background: linear-gradient(90deg, #000, #000);
      background-size: 200% 100%;
      animation: line-scan 3s infinite linear;
    }

    .dots {
      display: inline-flex;
      gap: 5px;
      margin: 0 5px;
    }

    .dot {
      width: 30px;
      height: 30px;
      background: #4A90E2;
      border-radius: 50%;
      transform-origin: center bottom;
    }

    .dot:nth-child(1) {
      animation: dot-blink 4s infinite;
    }

    .dot:nth-child(2) {
      animation: dot-blink 4s infinite 0.5s;
    }

    @keyframes twinkle {
      0% { opacity: 0.7; transform: scale(0.95); }
      100% { opacity: 1; transform: scale(1.05); }
    }

    @keyframes message-typing {
      0% { opacity: 0.7; transform: translate(-5px, 15px) scale(0.98); }
      25% { opacity: 0.8; transform: translate(-5px, 15px) scale(0.99); }
      50% { opacity: 0.9; transform: translate(-5px, 15px) scale(1.01); }
      75% { opacity: 1; transform: translate(-5px, 15px) scale(1.02); }
      100% { opacity: 0.7; transform: translate(-5px, 15px) scale(0.98); }
    }

    @keyframes dance1 {
      0%, 100% { transform: translate(-30px, 15px) scale(1); }
      25% { transform: translate(-20px, 5px) scale(0.9) rotate(10deg); }
      50% { transform: translate(-30px, 15px) scale(1.1); }
      75% { transform: translate(-40px, 25px) scale(0.9) rotate(-10deg); }
    }

    @keyframes dance2 {
      0%, 100% { transform: translate(-60px, 15px) scale(1); }
      25% { transform: translate(-70px, 25px) scale(0.9) rotate(-10deg); }
      50% { transform: translate(-60px, 15px) scale(1.1); }
      75% { transform: translate(-50px, 5px) scale(0.9) rotate(10deg); }
    }

    @keyframes slide-toggle {
      0%, 30% { transform: translateX(0); }
      40%, 60% { transform: translateX(-3.2rem); }
      70%, 100% { transform: translateX(0); }
    }

    @keyframes dot-blink {
      0%, 10%, 25%, 100% { opacity: 1; transform: scale(1); }
      5%, 20% { opacity: 0.4; transform: scale(0.8); }
    }

    @keyframes line-scan {
      0% { background-position: 100% 0; }
      100% { background-position: -100% 0; }
    }

    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }

    @media (max-width: 1200px) {
      .hero-text { font-size: 4.5rem; }
      .message-load-image { width: 22rem; }
      .polygon-image1, .polygon-image2, .star-image { width: 5rem; height: 5rem; }
      .arrow-circle { width: 5rem; height: 5rem; }
      .toggle-switch { width: 8rem; height: 5rem; }
      .toggle-switch::after { width: 4.5rem; height: 4.5rem; }
      .dots-line { transform: translate(120px, -70px); }
    }

    @media (max-width: 992px) {
      .hero-text { font-size: 3.5rem; }
      .text-segment { margin: 0 0.3rem; }
      .component-group-before { height: 4rem; margin: 0.75rem; transform: translate(5px, 0); }
      .component-group-after { height: 4rem; margin: 0.75rem; transform: translate(-20px, -15px); }
      .message-load-image { width: 18rem; transform: translate(-5px, 10px); }
      @keyframes message-typing {
        0% { opacity: 0.7; transform: translate(-5px, 10px) scale(0.98); }
        25% { opacity: 0.8; transform: translate(-5px, 10px) scale(0.99); }
        50% { opacity: 0.9; transform: translate(-5px, 10px) scale(1.01); }
        75% { opacity: 1; transform: translate(-5px, 10px) scale(1.02); }
        100% { opacity: 0.7; transform: translate(-5px, 10px) scale(0.98); }
      }
      .polygon-image1, .polygon-image2, .star-image, .star { width: 4rem; height: 4rem; }
      .arrow-circle { width: 4.5rem; height: 4.5rem; }
      .arrow-image { width: 2.5rem; height: 2.5rem; }
      .toggle-switch { width: 6rem; height: 4rem; }
      .toggle-switch::after { width: 3.5rem; height: 3.5rem; }
      @keyframes slide-toggle {
        0%, 30% { transform: translateX(0); }
        40%, 60% { transform: translateX(-2.2rem); }
        70%, 100% { transform: translateX(0); }
      }
      .dots-line { transform: translate(100px, -60px); }
      .line { width: 60px; height: 3px; }
      .dot { width: 25px; height: 25px; }
    }

    @media (max-width: 768px) {
      .hero-text-container { padding: 1.5rem; }
      .hero-text { font-size: 2.5rem; }
      .component-group-before, .component-group-after { height: 3rem; margin: 0.5rem; }
      .component-group-before { transform: translate(5px, 0); }
      .component-group-after { transform: translate(-15px, -10px); }
      .message-load-image { width: 14rem; transform: translate(-3px, 8px); }
      @keyframes message-typing {
        0% { opacity: 0.7; transform: translate(-3px, 8px) scale(0.98); }
        25% { opacity: 0.8; transform: translate(-3px, 8px) scale(0.99); }
        50% { opacity: 0.9; transform: translate(-3px, 8px) scale(1.01); }
        75% { opacity: 1; transform: translate(-3px, 8px) scale(1.02); }
        100% { opacity: 0.7; transform: translate(-3px, 8px) scale(0.98); }
      }
      .star, .polygon-image1, .polygon-image2, .star-image { width: 3rem; height: 3rem; }
      .arrow-circle { width: 3.5rem; height: 3.5rem; }
      .arrow-image { width: 1.8rem; height: 1.8rem; }
      .toggle-switch { width: 4.5rem; height: 2.5rem; }
      .toggle-switch::after { width: 2.2rem; height: 2.2rem; }
      @keyframes slide-toggle {
        0%, 30% { transform: translateX(0); }
        40%, 60% { transform: translateX(-1.5rem); }
        70%, 100% { transform: translateX(0); }
      }
      .dots-line { transform: translate(70px, -40px); }
      .line { width: 50px; height: 2.5px; }
      .dot { width: 20px; height: 20px; }
    }

    @media (max-width: 480px) {
      .hero-text-container { padding: 1rem; }
      .hero-text { font-size: 1.8rem; line-height: 1.3; }
      .text-segment { margin: 0 0.2rem; }
      .component-group-before { height: 2.5rem; margin: 0.3rem; transform: translate(3px, 0); }
      .component-group-after { height: 1rem; margin: 0.3rem; transform: translate(-10px, -8px); }
      .message-load-image { width: 12rem; transform: translate(-2px, 8px); }
      @keyframes message-typing {
        0% { opacity: 0.7; transform: translate(-2px, 5px) scale(0.98); }
        25% { opacity: 0.8; transform: translate(-2px, 5px) scale(0.99); }
        50% { opacity: 0.9; transform: translate(-2px, 5px) scale(1.01); }
        75% { opacity: 1; transform: translate(-2px, 5px) scale(1.02); }
        100% { opacity: 0.7; transform: translate(-2px, 5px) scale(0.98); }
      }
      .polygon-image1, .polygon-image2, .star-image, .star { width: 2.2rem; height: 2.2rem; }
      .arrow-circle { width: 2.8rem; height: 2.8rem; }
      .arrow-image { width: 1.5rem; height: 1.5rem; }
      .toggle-switch { width: 3.5rem; height: 2rem; }
      .toggle-switch::after { width: 1.7rem; height: 1.7rem; top: 2px; right: 2px; }
      @keyframes slide-toggle {
        0%, 30% { transform: translateX(0); }
        40%, 60% { transform: translateX(-1.2rem); }
        70%, 100% { transform: translateX(0); }
      }
      .dots-line { transform: translate(40px, -30px); }
      .line { width: 40px; height: 2px; }
      .dot { width: 15px; height: 15px; }
      .dots { gap: 3px; }
    }
  `;

  return (
    <section className="relative bg-white py-20 pt-36 text-slate-800">
      <style>{styles}</style>
      <div className="absolute top-6 left-6 z-20">
        <a href="/" className="block" aria-label="SRV Home">
          <img src="/logo.svg" alt="SRV Logo" className="h-16 w-auto" />
        </a>
      </div>

      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center text-center">
          <div className="hero-text-container">
            <div className="hero-text">
              {/* First line: Ang Serbisyo, with arrow and toggle */}
              <div className="text-line">
                <span className="text-segment">Ang Serbisyo,</span>
                <div className="component-group line-1-components">
                  <div className="arrow-circle">
                    <img src="/hero/arrow.png" alt="Arrow" className="arrow-image" />
                  </div>
                  <div className="toggle-switch"></div>
                </div>
              </div>
              
              {/* Second line: Star, Rito ay with message bubble */}
              <div className="text-line">
                <div className="component-group line-2-components">
                  <div className="star"></div>
                </div>
                <span className="text-segment">Rito ay</span>
                <div className="component-group">
                  <img src="/hero/message-load.svg" alt="Typing message animation" className="message-load-image" />
                </div>
              </div>
              
              {/* Third line: always Valued! with dots and line */}
              <div className="text-line">
                <div className="dots-line">
                  <div className="line"></div>
                  <div className="dots">
                    <div className="dot"></div>
                    <div className="dot"></div>
                  </div>
                </div>
                <span className="text-segment">always Valued!</span>
                <div className="component-group line-3-components">
                  <img src="/hero/polygon1.svg" alt="Decorative polygon" className="polygon-image1" />
                  <img src="/hero/polygon1.svg" alt="Decorative polygon" className="polygon-image2" />
                </div>
              </div>
            </div>
          </div>

          <p className="mx-auto max-w-4xl text-lg text-gray-600">
            Finding reliable help for everyday tasks can be a challenge. SRV is
            your user-friendly platform to easily discover, compare, and book a
            wide range of local on-demand service providers.
          </p>

          {/* Action Buttons */}
          <div className="mt-10">
            <button
              onClick={onLoginClick}
              disabled={isLoginLoading}
              className={`flex transform items-center justify-center rounded-lg bg-yellow-400 px-8 py-4 text-lg font-bold text-slate-800 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-yellow-500 hover:shadow-xl ${isLoginLoading ? "cursor-not-allowed opacity-70" : ""}`}
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
  );
}
