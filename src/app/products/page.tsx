'use client';

import { useEffect, useState } from 'react';
import { ProductCard } from '@/components/ProductCard';
import { getProducts, getProductsByCategory, healthCheck, Product } from '@/lib/api';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface ProductsPageState {
  products: Product[];
  filteredProducts: Product[];
  loading: boolean;
  workerStatus: 'checking' | 'online' | 'offline';
  selectedCategory: string;
  categories: string[];
  sortBy: string;
  searchQuery: string;
}

const CATEGORIES = [
  'all',
  'Adaptogens',
  'Herbal Teas',
  'Digestive Health',
  'Brain Health',
  'Skin Care',
  'Immunity'
];

export default function ProductsPage() {
  const [state, setState] = useState<ProductsPageState>({
    products: [],
    filteredProducts: [],
    loading: true,
    workerStatus: 'checking',
    selectedCategory: 'all',
    categories: CATEGORIES,
    sortBy: 'featured',
    searchQuery: '',
  });

  useEffect(() => {
    async function loadProducts() {
      try {
        const health = await healthCheck();
        
        setState(prev => ({
          ...prev,
          workerStatus: health.online ? 'online' : 'offline',
        }));

        let productsData: Product[];

        if (health.online) {
          productsData = await getProducts();
        } else {
          const { getSampleProducts } = await import('@/lib/api');
          productsData = getSampleProducts();
        }

        // Extract unique categories from products
        const productCategories = [...new Set(productsData.map(p => p.category))];
        const allCategories = ['all', ...productCategories];

        setState(prev => ({
          ...prev,
          products: productsData,
          filteredProducts: productsData,
          categories: allCategories,
          loading: false,
        }));
      } catch (error) {
        console.error('Failed to load products:', error);
        setState(prev => ({ ...prev, loading: false }));
      }
    }

    loadProducts();
  }, []);

  // Filter and sort products whenever dependencies change
  useEffect(() => {
    let result = [...state.products];

    // Apply category filter
    if (state.selectedCategory !== 'all') {
      result = result.filter(p => p.category === state.selectedCategory);
    }

    // Apply search filter
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    switch (state.sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        // Keep original order for 'featured'
        break;
    }

    setState(prev => ({ ...prev, filteredProducts: result }));
  }, [state.selectedCategory, state.sortBy, state.searchQuery, state.products]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  return (
    <>
      <Header workerOnline={state.workerStatus === 'online'} />
      
      <main className="products-page">
        {/* Products Header */}
        <section className="products-hero">
          <div className="container">
            <span className="section-badge">Our Collection</span>
            <h1>Ayurvedic Herbal Products</h1>
            <p className="hero-description">
              Pure, natural, and effective herbal formulations for your complete wellness journey.
            </p>
          </div>
        </section>

        {/* Filters & Controls */}
        <section className="products-controls">
          <div className="container">
            <div className="controls-wrapper">
              {/* Search */}
              <form className="product-search" onSubmit={handleSearch}>
                <input
                  type="search"
                  placeholder="Search products..."
                  value={state.searchQuery}
                  onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
                  aria-label="Search products"
                />
                <button type="submit">🔍</button>
              </form>

              {/* Sort */}
              <div className="sort-control">
                <label htmlFor="sort-select">Sort by:</label>
                <select
                  id="sort-select"
                  value={state.sortBy}
                  onChange={(e) => setState(prev => ({ ...prev, sortBy: e.target.value }))}
                >
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name">Name: A-Z</option>
                </select>
              </div>
            </div>

            {/* Category Tabs */}
            <div className="category-tabs">
              {state.categories.map((category) => (
                <button
                  key={category}
                  className={`category-tab ${state.selectedCategory === category ? 'active' : ''}`}
                  onClick={() => setState(prev => ({ ...prev, selectedCategory: category }))}
                >
                  {category === 'all' ? 'All Products' : category}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Results Info */}
        <div className="container">
          <p className="results-count">
            Showing {state.filteredProducts.length} of {state.products.length} products
            {state.selectedCategory !== 'all' && ` in ${state.selectedCategory}`}
          </p>
        </div>

        {/* Products Grid */}
        <section className="products-grid-section section">
          <div className="container">
            {state.filteredProducts.length > 0 ? (
              <div className="products-grid">
                {state.filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="empty-state large">
                <span className="empty-icon">🌿</span>
                <h3>No products found</h3>
                <p>
                  {state.searchQuery
                    ? `No results for "${state.searchQuery}". Try different keywords.`
                    : state.selectedCategory !== 'all'
                    ? `No products in "${state.selectedCategory}" yet.`
                    : 'Products coming soon!'}
                </p>
                {(state.searchQuery || state.selectedCategory !== 'all') && (
                  <button
                    className="btn btn-secondary"
                    onClick={() =>
                      setState(prev => ({
                        ...prev,
                        searchQuery: '',
                        selectedCategory: 'all',
                      }))
                    }
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Trust Section */}
        <section className="trust-section alt-bg">
          <div className="container">
            <div className="trust-badges-row">
              <div className="trust-item">
                <span className="trust-icon">🔬</span>
                <h4>Lab Tested</h4>
                <p>All products undergo rigorous quality testing</p>
              </div>
              <div className="trust-item">
                <span className="trust-icon">🌿</span>
                <h4>100% Natural</h4>
                <p>Pure herbs with no artificial additives</p>
              </div>
              <div className="trust-item">
                <span className="trust-icon">📜</span>
                <h4>Ayush Certified</h4>
                <p>Certified by Ministry of AYUSH, India</p>
              </div>
              <div className="trust-item">
                <span className="trust-icon">🚚</span>
                <h4>Free Shipping</h4>
                <p>On orders above ₹999</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
