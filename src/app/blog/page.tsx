'use client';

import { useEffect, useState } from 'react';
import { BlogPostCard } from '@/components/BlogPostCard';
import { getBlogPosts, healthCheck, BlogPost } from '@/lib/api';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface BlogPageState {
  posts: BlogPost[];
  filteredPosts: BlogPost[];
  loading: boolean;
  workerStatus: 'checking' | 'online' | 'offline';
  selectedCategory: string;
  categories: string[];
}

export default function BlogPage() {
  const [state, setState] = useState<BlogPageState>({
    posts: [],
    filteredPosts: [],
    loading: true,
    workerStatus: 'checking',
    selectedCategory: 'all',
    categories: [],
  });

  useEffect(() => {
    async function loadBlogData() {
      try {
        const health = await healthCheck();
        
        setState(prev => ({
          ...prev,
          workerStatus: health.online ? 'online' : 'offline',
        }));

        let postsData: BlogPost[];

        if (health.online) {
          postsData = await getBlogPosts();
        } else {
          const { getSampleBlogPosts } = await import('@/lib/api');
          postsData = getSampleBlogPosts();
        }

        // Extract unique categories
        const categories = ['all', ...new Set(postsData.map(p => p.category).filter(Boolean)) as string[]];

        setState(prev => ({
          ...prev,
          posts: postsData,
          filteredPosts: postsData.filter(p => p.published),
          categories,
          loading: false,
        }));
      } catch (error) {
        console.error('Failed to load blog data:', error);
        setState(prev => ({ ...prev, loading: false }));
      }
    }

    loadBlogData();
  }, []);

  const handleCategoryChange = (category: string) => {
    setState(prev => ({
      ...prev,
      selectedCategory: category,
      filteredPosts: category === 'all' 
        ? prev.posts.filter(p => p.published)
        : prev.posts.filter(p => p.published && p.category === category),
    }));
  };

  if (state.loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner"></div>
        <p>Loading blog...</p>
      </div>
    );
  }

  return (
    <>
      <Header workerOnline={state.workerStatus === 'online'} />
      
      <main className="blog-page">
        {/* Blog Header */}
        <section className="blog-hero">
          <div className="container">
            <span className="section-badge">Wellness Journal</span>
            <h1>Herbal Wisdom Blog</h1>
            <p className="hero-description">
              Explore articles on Ayurveda, herbal remedies, holistic wellness, 
              and ancient healing traditions for modern living.
            </p>
            
            {/* Search Bar */}
            <form className="blog-search" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="search" 
                placeholder="Search articles..."
                aria-label="Search blog"
              />
              <button type="submit">🔍</button>
            </form>
          </div>
        </section>

        {/* Category Filter */}
        {state.categories.length > 1 && (
          <section className="category-filter">
            <div className="container">
              <div className="filter-tabs">
                {state.categories.map((category) => (
                  <button
                    key={category}
                    className={`filter-tab ${state.selectedCategory === category ? 'active' : ''}`}
                    onClick={() => handleCategoryChange(category)}
                  >
                    {category === 'all' ? 'All Posts' : category}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Featured Post (First post) */}
        {!state.loading && state.filteredPosts.length > 0 && state.selectedCategory === 'all' && (
          <section className="featured-post-section">
            <div className="container">
              <BlogPostCard 
                post={state.filteredPosts[0]} 
                variant="featured"
              />
            </div>
          </section>
        )}

        {/* Posts Grid */}
        <section className="posts-section section">
          <div className="container">
            <div className="posts-grid">
              {state.filteredPosts.length > 0 ? (
                // Skip first post if showing featured and on "all" category
                state.filteredPosts
                  .slice(state.selectedCategory === 'all' ? 1 : 0)
                  .map((post) => (
                    <BlogPostCard key={post.id} post={post} />
                  ))
              ) : (
                <div className="empty-state large">
                  <span className="empty-icon">📝</span>
                  <h3>No posts found</h3>
                  <p>
                    {state.selectedCategory !== 'all'
                      ? `No posts in "${state.selectedCategory}" category yet.`
                      : 'Blog posts will appear here soon.'}
                  </p>
                  {state.selectedCategory !== 'all' && (
                    <button 
                      className="btn btn-secondary"
                      onClick={() => handleCategoryChange('all')}
                    >
                      View All Posts
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Load More Button (for future pagination) */}
            {state.filteredPosts.length > 6 && (
              <div className="load-more">
                <button className="btn btn-outline">Load More Articles</button>
              </div>
            )}
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="blog-cta">
          <div className="container">
            <div className="cta-box">
              <h2>Stay Updated</h2>
              <p>Get weekly wellness tips and new article notifications delivered to your inbox.</p>
              <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
                <input type="email" placeholder="Your email address" required />
                <button type="submit" className="btn btn-primary">Subscribe</button>
              </form>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
