'use client';

import Link from 'next/link';
import { useState } from 'react';

interface HeaderProps {
  workerOnline?: boolean;
}

export default function Header({ workerOnline = true }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="header-container">
        {/* Logo */}
        <Link href="/" className="logo">
          <span className="logo-icon">🌿</span>
          <div className="logo-text">
            <span className="logo-name">HimVedi</span>
            <span className="logo-tagline">Herbals</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className={`main-nav ${menuOpen ? 'open' : ''}`}>
          <Link href="/" onClick={() => setMenuOpen(false)}>Home</Link>
          <Link href="/products" onClick={() => setMenuOpen(false)}>Products</Link>
          <Link href="/blog" onClick={() => setMenuOpen(false)}>Blog</Link>
          <Link href="/about" onClick={() => setMenuOpen(false)}>About</Link>
          <Link href="/contact" onClick={() => setMenuOpen(false)}>Contact</Link>
        </nav>

        {/* Right Section */}
        <div className="header-right">
          {/* API Status Indicator */}
          <div className={`api-status ${workerOnline ? 'online' : 'offline'}`} title="API Status">
            <span className="status-dot"></span>
            <span className="status-text">{workerOnline ? 'Connected' : 'Offline'}</span>
          </div>

          {/* Cart Button */}
          <button className="cart-btn" aria-label="Shopping Cart">
            🛒
            <span className="cart-count">0</span>
          </button>

          {/* Mobile Menu Toggle */}
          <button 
            className={`mobile-menu-toggle ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle Menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMenuOpen(false)} />
      )}
    </header>
  );
}
