'use client';

import { useEffect, useState } from 'react';
import { ProductCard } from '@/components';
import { BlogPostCard } from '@/components/BlogPostCard';
import { getProducts, getPublishedPosts, healthCheck, Product, BlogPost } from '@/lib/api';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface HomePageState {
  products: Product[];
  posts: BlogPost[];
  loading: boolean;
  workerStatus: 'checking' | 'online' | 'offline';
}

export default function HomePage() {
  const [state, setState] = useState<HomePageState>({
    products: [],
    posts: [],
    loading: true,
    workerStatus: 'checking',
  });

  useEffect(() => {
    async function loadHomePageData() {
      try {
        // Check Worker status
        const health = await healthCheck();
        
        setState(prev => ({
          ...prev,
          workerStatus: health.online ? 'online' : 'offline',
        }));

        // Load data in parallel
        if (health.online) {
          const [productsData, postsData] = await Promise.all([
            getProducts(),
            getPublishedPosts(),
          ]);

          setState(prev => ({
            ...prev,
            products: productsData,
            posts: postsData.slice(0, 3), // Show only latest 3 posts
            loading: false,
          }));
        } else {
          // Use sample data when offline
          const { getSampleProducts, getSampleBlogPosts } = await import('@/lib/api');
          setState(prev => ({
            ...prev,
            products: getSampleProducts(),
            posts: getSampleBlogPosts().slice(0, 3),
            loading: false,
          }));
        }
      } catch (error) {
        console.error('Failed to load home page data:', error);
        setState(prev => ({ ...prev, loading: false }));
      }
    }

    loadHomePageData();
  }, []);

  if (state.loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner"></div>
        <p>Loading HimVedi Herbals...</p>
      </div>
    );
  }

  return (
    <>
      <Header workerOnline={state.workerStatus === 'online'} />
      
      <main className="home-page">
        {/* Hero Section */}
        <section className="hero">
          <div className="hero-content">
            <div className="hero-badge">🌿 100% Natural Ayurvedic Products</div>
            <h1>Ancient Wisdom for<br />Modern Wellness</h1>
            <p className="hero-subtitle">
              Discover authentic herbal remedies crafted from traditional 
              Ayurvedic recipes passed down through generations.
            </p>
            <div className="hero-actions">
              <a href="/products" className="btn btn-primary">
                Shop Now
              </a>
              <a href="/blog" className="btn btn-secondary">
                Our Story
              </a>
            </div>

            {/* Trust Badges */}
            <div className="trust-badges">
              <div className="badge">
                <span className="badge-icon">✓</span>
                <span>Lab Tested</span>
              </div>
              <div className="badge">
                <span className="badge-icon">✓</span>
                <span>Pure Herbs</span>
              </div>
              <div className="badge">
                <span className="badge-icon">✓</span>
                <span>No Side Effects</span>
              </div>
              <div className="badge">
                <span className="badge-icon">✓</span>
                <span>GMP Certified</span>
              </div>
            </div>
          </div>
          
          <div className="hero-visual">
            <div className="herbs-decoration">
              <span className="herb leaf-1">🌿</span>
              <span className="herb leaf-2">🍃</span>
              <span className="herb flower">🌸</span>
              <span className="herb leaf-3">🌱</span>
            </div>
          </div>
        </section>

        {/* Featured Products Section */}
        <section className="featured-products section">
          <div className="container">
            <div className="section-header">
              <span className="section-badge">Our Collection</span>
              <h2>Featured Herbal Products</h2>
              <p className="section-description">
                Handpicked selection of our most popular and effective Ayurvedic formulations
              </p>
            </div>

            <div className="products-grid">
              {state.products.length > 0 ? (
                state.products.slice(0, 6).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : (
                <div className="empty-state">
                  <p>Products coming soon!</p>
                </div>
              )}
            </div>

            <div className="section-footer">
              <a href="/products" className="btn btn-outline">
                View All Products →
              </a>
            </div>
          </div>
        </section>

        {/* About/Value Proposition */}
        <section className="value-prop section alt-bg">
          <div className="container">
            <div className="value-grid">
              <div className="value-content">
                <span className="section-badge">Why Choose Us</span>
                <h2>The HimVedi Difference</h2>
                <p>
                  At HimVedi Herbals, we blend centuries-old Ayurvedic wisdom with 
                  modern quality standards to bring you herbal products that truly work.
                </p>
                
                <ul className="value-list">
                  <li>
                    <span className="check-icon">✓</span>
                    <div>
                      <strong>Sourced from Himalayas</strong>
                      <p>Pure herbs grown in pristine mountain environments</p>
                    </div>
                  </li>
                  <li>
                    <span className="check-icon">✓</span>
                    <div>
                      <strong>Traditional Formulations</strong>
                      <p>Recipes perfected over generations of Vaidyas</p>
                    </div>
                  </li>
                  <li>
                    <span className="check-icon">✓</span>
                    <div>
                      <strong>Modern Quality Control</strong>
                      <p>Rigorous testing at every stage of production</p>
                    </div>
                  </li>
                  <li>
                    <span className="check-icon">✓</span>
                    <div>
                      <strong>Eco-Friendly Packaging</strong>
                      <p>Sustainable materials that protect our planet</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="value-image">
                <div className="image-placeholder">
                  <span>🏔️</span>
                  <p>Himalayan Herbs</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Latest Blog Posts */}
        <section className="latest-blog section">
          <div className="container">
            <div className="section-header">
              <span className="section-badge">Wellness Blog</span>
              <h2>Latest Health Insights</h2>
              <p className="section-description">
                Expert articles on Ayurveda, herbal remedies, and holistic wellness
              </p>
            </div>

            <div className="blog-grid">
              {state.posts.length > 0 ? (
                state.posts.map((post) => (
                  <BlogPostCard 
                    key={post.id} 
                    post={post}
                    variant={post === state.posts[0] ? 'featured' : 'default'}
                  />
                ))
              ) : (
                <div className="empty-state">
                  <p>Blog posts coming soon!</p>
                </div>
              )}
            </div>

            <div className="section-footer">
              <a href="/blog" className="btn btn-outline">
                Read All Articles →
              </a>
            </div>
          </div>
        </section>

        {/* Categories Preview */}
        <section className="categories-preview section alt-bg">
          <div className="container">
            <div className="section-header center">
              <span className="section-badge">Shop by Category</span>
              <h2>Browse Our Range</h2>
            </div>

            <div className="categories-grid">
              <a href="/products?category=adaptogens" className="category-card">
                <span className="category-icon">🧘</span>
                <h3>Adaptogens</h3>
                <p>Stress relief & energy</p>
              </a>
              <a href="/products?category=herbal-teas" className="category-card">
                <span className="category-icon">🍵</span>
                <h3>Herbal Teas</h3>
                <p>Daily wellness brews</p>
              </a>
              <a href="/products?category=digestive-health" className="category-card">
                <span className="category-icon">💚</span>
                <h3>Digestive Health</h3>
                <p>Gut health support</p>
              </a>
              <a href="/products?category=brain-health" className="category-card">
                <span className="category-icon">🧠</span>
                <h3>Brain Health</h3>
                <p>Memory & focus</p>
              </a>
              <a href="/products?category=skin-care" className="category-card">
                <span className="category-icon">✨</span>
                <h3>Skin Care</h3>
                <p>Natural beauty</p>
              </a>
              <a href="/products?category=immunity" className="category-card">
                <span className="category-icon">🛡️</span>
                <h3>Immunity</h3>
                <p>Defense boosters</p>
              </a>
            </div>
          </div>
        </section>

        {/* CTA / Newsletter */}
        <section className="cta-section">
          <div className="container">
            <div className="cta-content">
              <h2>Join the Wellness Revolution</h2>
              <p>
                Subscribe to our newsletter for exclusive offers, health tips, 
                and early access to new products.
              </p>
              <form className="cta-form" onSubmit={(e) => e.preventDefault()}>
                <input 
                  type="email" 
                  placeholder="Enter your email address"
                  required
                />
                <button type="submit" className="btn btn-primary">
                  Subscribe Now
                </button>
              </form>
              <p className="cta-note">
                🔒 No spam. Unsubscribe anytime. Get 10% off your first order!
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
