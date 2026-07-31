'use client';

import { Product } from '@/lib/api';
import Image from 'next/image';

interface ProductCardProps {
  product: Product;
  variant?: 'default' | 'compact' | 'featured';
}

export default function ProductCard({ product, variant = 'default' }: ProductCardProps) {
  const discount = product.compare_price 
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0;

  if (variant === 'compact') {
    return (
      <div className="product-card compact">
        <div className="product-image-wrapper">
          {product.image_url && (
            <Image 
              src={product.image_url} 
              alt={product.name}
              width={200}
              height={150}
              className="product-image"
            />
          )}
          {discount > 0 && <span className="discount-badge">-{discount}%</span>}
        </div>
        <div className="product-info">
          <h4>{product.name}</h4>
          <p className="price">${product.price.toFixed(2)}</p>
        </div>
      </div>
    );
  }

  if (variant === 'featured') {
    return (
      <div className="product-card featured">
        <div className="product-image-wrapper large">
          {product.image_url && (
            <Image 
              src={product.image_url} 
              alt={product.name}
              width={400}
              height={300}
              className="product-image"
            />
          )}
          <span className="category-badge">{product.category}</span>
        </div>
        <div className="product-info">
          <h3>{product.name}</h3>
          {product.short_description && (
            <p className="short-description">{product.short_description}</p>
          )}
          <div className="price-row">
            <span className="current-price">${product.price.toFixed(2)}</span>
            {product.compare_price && (
              <span className="original-price">${product.compare_price.toFixed(2)}</span>
            )}
            {discount > 0 && <span className="discount-badge">-{discount}%</span>}
          </div>
          <button className="add-to-cart-btn" disabled={!product.in_stock}>
            {product.in_stock ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <article className="product-card">
      <div className="product-image-wrapper">
        {product.image_url ? (
          <Image 
            src={product.image_url} 
            alt={product.name}
            width={300}
            height={250}
            className="product-image"
          />
        ) : (
          <div className="product-placeholder">
            <span>🌿</span>
          </div>
        )}
        
        {/* Badges */}
        <div className="badges">
          <span className="category-badge">{product.category}</span>
          {!product.in_stock && <span className="out-of-stock">Sold Out</span>}
          {discount > 0 && <span className="discount-badge">-{discount}%</span>}
        </div>
      </div>

      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        
        {product.short_description && (
          <p className="short-description">{product.short_description}</p>
        )}

        {/* Benefits preview */}
        {product.benefits && product.benefits.length > 0 && (
          <ul className="benefits-preview">
            {product.benefits.slice(0, 2).map((benefit, index) => (
              <li key={index}>{benefit}</li>
            ))}
          </ul>
        )}

        <div className="product-meta">
          {product.weight && <span className="weight">{product.weight}</span>}
        </div>

        <div className="price-row">
          <span className="current-price">${product.price.toFixed(2)}</span>
          {product.compare_price && (
            <>
              <span className="original-price">${product.compare_price.toFixed(2)}</span>
              <span className="savings">Save ${(product.compare_price - product.price).toFixed(2)}</span>
            </>
          )}
        </div>

        <button 
          className={`add-to-cart-btn ${!product.in_stock ? 'disabled' : ''}`}
          disabled={!product.in_stock}
        >
          {product.in_stock ? '🛒 Add to Cart' : '⏳ Out of Stock'}
        </button>

        {product.usage_instructions && (
          <details className="usage-info">
            <summary>How to Use</summary>
            <p>{product.usage_instructions}</p>
          </details>
        )}
      </div>
    </article>
  );
}
