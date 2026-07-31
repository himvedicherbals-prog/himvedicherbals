import Link from 'next/link';

interface FooterProps {
  currentYear?: number;
}

export default function Footer({ currentYear }: FooterProps) {
  const year = currentYear || new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-container">
        {/* Main Footer Content */}
        <div className="footer-grid">
          {/* Brand Column */}
          <div className="footer-brand">
            <Link href="/" className="footer-logo">
              <span className="logo-icon">🌿</span>
              <div className="logo-text">
                <span className="logo-name">HimVedi</span>
                <span className="logo-tagline">Herbals</span>
              </div>
            </Link>
            <p className="footer-description">
              Ancient Ayurvedic wisdom for modern wellness. We bring you authentic 
              herbal products crafted from traditional recipes passed down through generations.
            </p>
            <div className="social-links">
              <a href="#" aria-label="Facebook" className="social-link">f</a>
              <a href="#" aria-label="Instagram" className="social-link">📷</a>
              <a href="#" aria-label="Twitter" className="social-link">𝕏</a>
              <a href="#" aria-label="YouTube" className="social-link">▶️</a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-links">
            <h4>Quick Links</h4>
            <nav>
              <Link href="/">Home</Link>
              <Link href="/products">Products</Link>
              <Link href="/blog">Blog</Link>
              <Link href="/about">About Us</Link>
              <Link href="/contact">Contact</Link>
            </nav>
          </div>

          {/* Categories */}
          <div className="footer-links">
            <h4>Categories</h4>
            <nav>
              <Link href="/products?category=adaptogens">Adaptogens</Link>
              <Link href="/products?category=herbal-teas">Herbal Teas</Link>
              <Link href="/products?category=digestive-health">Digestive Health</Link>
              <Link href="/products?category=brain-health">Brain Health</Link>
              <Link href="/products?category=skin-care">Skin Care</Link>
              <Link href="/products?category=immunity">Immunity</Link>
            </nav>
          </div>

          {/* Contact Info */}
          <div className="footer-contact">
            <h4>Contact Us</h4>
            <address>
              <p>📍 123 Ayurvedic Lane</p>
              <p>Rishikesh, Uttarakhand</p>
              <p>India - 249201</p>
              <p>📧 info@himvedicherbals.com</p>
              <p>📞 +91 98765 43210</p>
            </address>
          </div>
        </div>

        {/* Newsletter */}
        <div className="newsletter-section">
          <h4>Subscribe to Our Newsletter</h4>
          <p>Get the latest updates on new products, health tips, and exclusive offers!</p>
          <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
            <input 
              type="email" 
              placeholder="Enter your email address"
              required
            />
            <button type="submit">Subscribe</button>
          </form>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p className="copyright">
            © {year} HimVedi Herbals. All rights reserved.
          </p>
          <div className="legal-links">
            <Link href="/privacy-policy">Privacy Policy</Link>
            <Link href="/terms-of-service">Terms of Service</Link>
            <Link href="/shipping-info">Shipping Info</Link>
            <Link href="/refund-policy">Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
