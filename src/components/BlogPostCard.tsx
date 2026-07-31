'use client';

import { BlogPost } from '@/lib/api';
import Link from 'next/link';

interface BlogPostCardProps {
  post: BlogPost;
  variant?: 'default' | 'compact' | 'featured';
  showExcerpt?: boolean;
}

export default function BlogPostCard({ 
  post, 
  variant = 'default',
  showExcerpt = true 
}: BlogPostCardProps) {
  const formattedDate = post.created_at 
    ? new Date(post.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : '';

  if (variant === 'compact') {
    return (
      <article className="blog-post-card compact">
        <Link href={`/blog/${post.slug || post.id}`}>
          <h4>{post.title}</h4>
          {formattedDate && <time>{formattedDate}</time>}
        </Link>
      </article>
    );
  }

  if (variant === 'featured') {
    return (
      <article className="blog-post-card featured">
        <Link href={`/blog/${post.slug || post.id}`} className="featured-link">
          {post.category && (
            <span className="post-category">{post.category}</span>
          )}
          <h2>{post.title}</h2>
          {showExcerpt && post.excerpt && (
            <p className="excerpt">{post.excerpt}</p>
          )}
          <div className="meta">
            {post.author && <span className="author">By {post.author}</span>}
            {formattedDate && <time>{formattedDate}</time>}
            <span className="read-more">Read More →</span>
          </div>
        </Link>
      </article>
    );
  }

  // Default variant
  return (
    <article className="blog-post-card">
      <Link href={`/blog/${post.slug || post.id}`}>
        {/* Category Badge */}
        {post.category && (
          <span className="post-category">{post.category}</span>
        )}

        {/* Title */}
        <h3>{post.title}</h3>

        {/* Meta Information */}
        <div className="post-meta">
          {post.author && (
            <span className="author">
              <span className="author-icon">✍️</span> {post.author}
            </span>
          )}
          {formattedDate && (
            <time dateTime={post.created_at}>
              <span className="date-icon">📅</span> {formattedDate}
            </time>
          )}
        </div>

        {/* Excerpt */}
        {showExcerpt && (
          <div className="content-preview">
            {post.excerpt ? (
              <p>{post.excerpt}</p>
            ) : post.content ? (
              <p dangerouslySetInnerHTML={{ 
                __html: post.content.length > 200 
                  ? post.content.substring(0, 200) + '...' 
                  : post.content 
              }} />
            ) : null}
          </div>
        )}

        {/* Read More */}
        <span className="read-more-link">
          Continue Reading →
        </span>
      </Link>
    </article>
  );
}

// Component for displaying full blog post
interface BlogPostFullProps {
  post: BlogPost;
}

export function BlogPostFull({ post }: BlogPostFullProps) {
  const formattedDate = post.created_at 
    ? new Date(post.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : '';

  return (
    <article className="blog-post-full">
      <header className="post-header">
        {post.category && (
          <span className="post-category">{post.category}</span>
        )}
        <h1>{post.title}</h1>
        
        <div className="post-meta">
          {post.author && (
            <span className="author">By {post.author}</span>
          )}
          {formattedDate && (
            <time dateTime={post.created_at}>{formattedDate}</time>
          )}
        </div>
      </header>

      <div 
        className="post-content"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      <footer className="post-footer">
        <Link href="/blog" className="back-link">
          ← Back to Blog
        </Link>
        
        {/* Share buttons placeholder */}
        <div className="share-section">
          <span>Share:</span>
          <button className="share-btn" aria-label="Share on Twitter">𝕏</button>
          <button className="share-btn" aria-label="Share on Facebook">f</button>
          <button className="share-btn" aria-label="Copy Link">🔗</button>
        </div>
      </footer>
    </article>
  );
}
