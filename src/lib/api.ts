// =============================================================================
// HIMVEDI HERBALS - API Integration Layer
// Connects Cloudflare Pages (Frontend) to Cloudflare Worker (Backend)
// =============================================================================

// ============================================================================
// CONFIGURATION - Update this URL with your actual Worker URL
// ============================================================================

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL || 'https://himvedicherbals-api.workers.dev';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  created_at?: string;
}

export interface BlogPost {
  id: number;
  title: string;
  slug?: string;
  content: string;
  excerpt?: string;
  author?: string;
  category?: string;
  published: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: number;
  name: string;
  slug?: string;
  description: string;
  short_description?: string;
  price: number;
  compare_price?: number;
  image_url?: string;
  images?: string[];
  category: string;
  in_stock: boolean;
  stock_quantity?: number;
  weight?: string;
  benefits?: string[];
  usage_instructions?: string;
  created_at?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

interface HealthResponse {
  message: string;
  endpoints: string[];
  status: 'healthy' | 'degraded';
}

// ============================================================================
// HELPER FUNCTION - Generic API Fetch
// ============================================================================

async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const url = `${WORKER_URL}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error);
    throw error;
  }
}

// ============================================================================
// HEALTH CHECK - Verify Worker is running
// ============================================================================

export async function healthCheck(): Promise<{ online: boolean; data?: HealthResponse }> {
  try {
    const data = await apiFetch<HealthResponse>('/');
    return { online: true, data };
  } catch (error) {
    console.error('Health check failed:', error);
    return { online: false };
  }
}

// ============================================================================
// USERS API (DB1 - users-db)
// ============================================================================

/**
 * Get all users from the database
 * Bound to: DB1 (users-db)
 */
export async function getUsers(): Promise<User[]> {
  try {
    const results = await apiFetch<User[]>('/api/users');
    return Array.isArray(results) ? results : [];
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return [];
  }
}

/**
 * Get a single user by ID
 */
export async function getUserById(id: number): Promise<User | null> {
  try {
    const users = await getUsers();
    return users.find(user => user.id === id) || null;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return null;
  }
}

// ============================================================================
// BLOG API (DB - blog-db)
// =============================================================================

/**
 * Get all blog posts from the database
 * Bound to: DB (blog-db)
 */
export async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const results = await apiFetch<BlogPost[]>('/api/blog');
    return Array.isArray(results) ? results : [];
  } catch (error) {
    console.error('Failed to fetch blog posts:', error);
    return [];
  }
}

/**
 * Get a single blog post by ID
 */
export async function getBlogPostById(id: number): Promise<BlogPost | null> {
  try {
    const posts = await getBlogPosts();
    return posts.find(post => post.id === id) || null;
  } catch (error) {
    console.error('Failed to fetch blog post:', error);
    return null;
  }
}

/**
 * Get published blog posts only
 */
export async function getPublishedPosts(): Promise<BlogPost[]> {
  try {
    const posts = await getBlogPosts();
    return posts.filter(post => post.published);
  } catch (error) {
    console.error('Failed to fetch published posts:', error);
    return [];
  }
}

/**
 * Get posts by category
 */
export async function getPostsByCategory(category: string): Promise<BlogPost[]> {
  try {
    const posts = await getBlogPosts();
    return posts.filter(post => 
      post.published && post.category?.toLowerCase() === category.toLowerCase()
    );
  } catch (error) {
    console.error('Failed to fetch posts by category:', error);
    return [];
  }
}

// ============================================================================
// PRODUCTS API (Can be added to Worker later)
// ============================================================================

/**
 * Get all products
 * Note: Add /api/products endpoint to your Worker if needed
 */
export async function getProducts(): Promise<Product[]> {
  try {
    // This endpoint may not exist yet in your Worker
    // You can add it following the same pattern as /api/blog and /api/users
    const results = await apiFetch<Product[]>('/api/products');
    return Array.isArray(results) ? results : [];
  } catch (error) {
    console.error('Failed to fetch products:', error);
    // Return sample products for demonstration
    return getSampleProducts();
  }
}

/**
 * Get a single product by ID
 */
export async function getProductById(id: number): Promise<Product | null> {
  try {
    const products = await getProducts();
    return products.find(product => product.id === id) || null;
  } catch (error) {
    console.error('Failed to fetch product:', error);
    return null;
  }
}

/**
 * Get products by category
 */
export async function getProductsByCategory(category: string): Promise<Product[]> {
  try {
    const products = await getProducts();
    return products.filter(product => 
      product.category.toLowerCase() === category.toLowerCase()
    );
  } catch (error) {
    console.error('Failed to fetch products by category:', error);
    return [];
  }
}

// ============================================================================
// SAMPLE DATA (Fallback when API is unavailable)
// ============================================================================

function getSampleProducts(): Product[] {
  return [
    {
      id: 1,
      name: "Ashwagandha Capsules",
      slug: "ashwagandha-capsules",
      description: "Premium quality Ashwagandha capsules made from pure root extract. Known for its adaptogenic properties that help combat stress and promote overall wellness.",
      short_description: "Natural stress relief & energy booster",
      price: 24.99,
      compare_price: 29.99,
      image_url: "/images/ashwagandha.jpg",
      category: "Adaptogens",
      in_stock: true,
      stock_quantity: 150,
      weight: "60 capsules",
      benefits: ["Reduces stress & anxiety", "Boosts energy levels", "Supports immune system", "Improves sleep quality"],
      usage_instructions: "Take 1-2 capsules daily with warm water or milk, preferably before bedtime."
    },
    {
      id: 2,
      name: "Tulsi Holy Basil Tea",
      slug: "tulsi-holy-basil-tea",
      description: "Aromatic and therapeutic Tulsi tea blend with Rama, Krishna, and Vana Tulsi varieties. Perfect for daily immunity boosting.",
      short_description: "Immunity boosting herbal tea",
      price: 12.99,
      image_url: "/images/tulsi-tea.jpg",
      category: "Herbal Teas",
      in_stock: true,
      stock_quantity: 200,
      weight: "100g",
      benefits: ["Strengthens immune system", "Respiratory health", "Stress relief", "Rich in antioxidants"],
      usage_instructions: "Steep 1 teaspoon in hot water for 5-7 minutes. Drink 2-3 times daily."
    },
    {
      id: 3,
      name: "Triphala Churna",
      slug: "triphala-churna",
      description: "Traditional Ayurvedic formulation of three fruits - Amla, Haritaki, and Bibhitaki. Excellent for digestive health and detoxification.",
      short_description: "Digestive health & detox formula",
      price: 18.99,
      compare_price: 22.99,
      image_url: "/images/triphala.jpg",
      category: "Digestive Health",
      in_stock: true,
      stock_quantity: 180,
      weight: "200g powder",
      benefits: ["Supports healthy digestion", "Natural detoxification", "Rich in Vitamin C", "Promotes regularity"],
      usage_instructions: "Mix 1/2 teaspoon with warm water and consume before bedtime."
    },
    {
      id: 4,
      name: "Brahmi Memory Support",
      slug: "brahmi-memory-support",
      description: "Pure Brahmi extract capsules to enhance cognitive function, memory, and concentration. Ideal for students and professionals.",
      short_description: "Brain health & memory enhancer",
      price: 19.99,
      image_url: "/images/brahmi.jpg",
      category: "Brain Health",
      in_stock: true,
      stock_quantity: 120,
      weight: "60 capsules",
      benefits: ["Enhances memory", "Improves concentration", "Reduces anxiety", "Supports brain health"],
      usage_instructions: "Take 1 capsule twice daily after meals."
    },
    {
      id: 5,
      name: "Neem Face Pack",
      slug: "neem-face-pack",
      description: "Natural neem-based face pack for clear, glowing skin. Helps with acne, pimples, and skin impurities.",
      short_description: "Clear skin naturally",
      price: 14.99,
      image_url: "/images/neem-pack.jpg",
      category: "Skin Care",
      in_stock: true,
      stock_quantity: 90,
      weight: "100g",
      benefits: ["Fights acne", "Clears impurities", "Soothes inflammation", "Natural antibacterial"],
      usage_instructions: "Mix with rose water or raw milk, apply evenly, leave for 15-20 minutes, then rinse."
    },
    {
      id: 6,
      name: "Chyawanprash Immunity Booster",
      slug: "chyawanprash-immunity-booster",
      description: "Traditional Ayurvedic immunity booster made with over 40 herbs and Amla base. Family wellness essential.",
      short_description: "Complete family immunity support",
      price: 16.99,
      compare_price: 19.99,
      image_url: "/images/chyawanprash.jpg",
      category: "Immunity",
      in_stock: true,
      stock_quantity: 75,
      weight: "500g",
      benefits: ["Boosts immunity", "Energy enhancement", "Digestive support", "Anti-aging properties"],
      usage_instructions: "Take 1-2 teaspoons daily with warm milk. Suitable for all ages above 3 years."
    }
  ];
}

function getSampleBlogPosts(): BlogPost[] {
  return [
    {
      id: 1,
      title: "The Ancient Wisdom of Ashwagandha: Modern Benefits of an Ancient Herb",
      slug: "ancient-wisdom-ashwagandha",
      content: `<p>Ashwagandha, known as <strong>Withania somnifera</strong> scientifically, has been a cornerstone of Ayurvedic medicine for over 3,000 years. This powerful adaptogenic herb has gained worldwide recognition for its remarkable health benefits.</p>
      
      <h3>What is Ashwagandha?</h3>
      <p>Ashwagandha is a small shrub with yellow flowers, native to India and North Africa. Its name comes from Sanskrit - "Ashwa" meaning horse and "Gandha" meaning smell, referring to its distinct horse-like odor.</p>
      
      <h3>Key Benefits:</h3>
      <ul>
        <li><strong>Stress Reduction:</strong> Studies show it can lower cortisol levels by up to 30%</li>
        <li><strong>Improved Sleep:</strong> Helps improve sleep quality and duration</li>
        <li><strong>Enhanced Athletic Performance:</strong> May increase strength and muscle mass</li>
        <li><strong>Brain Function:</strong> Supports memory, focus, and cognitive function</li>
        <li><strong>Immune Support:</strong> Strengthens the body's natural defense system</li>
      </ul>
      
      <h3>How to Use:</h3>
      <p>For best results, take 300-500mg of root extract daily. It can be consumed as capsules, powder mixed with warm milk, or as a tea infusion.</p>
      
      <blockquote>"Ashwagandha is one of the most important herbs in Ayurvedic medicine, often called Indian Ginseng." - Ayurvedic Text</blockquote>`,
      excerpt: "Discover the ancient wisdom behind Ashwagandha and how this powerful adaptogen can transform your health and wellness journey.",
      author: "Dr. Priya Sharma",
      category: "Herbal Knowledge",
      published: true,
      created_at: "2024-01-15T10:00:00Z"
    },
    {
      id: 2,
      title: "Building Daily Ayurvedic Rituals for Modern Life",
      slug: "daily-ayurvedic-rituals",
      content: `<p>In our fast-paced modern world, incorporating ancient Ayurvedic practices can bring balance, peace, and vitality to our daily lives.</p>
      
      <h3>Morning Routine (Dinacharya)</h3>
      <ol>
        <li><strong>Wake Early:</strong> Rise before sunrise for maximum energy alignment</li>
        <li><strong>Tongue Scraping:</strong> Remove toxins accumulated overnight</li>
        <li><strong>Oil Pulling:</strong> Swish sesame oil for oral health</li>
        <li><strong>Warm Water:</strong> Drink warm water with lemon to stimulate digestion</li>
        <li><strong>Self-Massage (Abhyanga):</strong> Massage body with warm oil</li>
        <li><strong>Yoga/Pranayama:</strong> Gentle movement and breathing exercises</li>
      </ol>
      
      <h3>Evening Wind-Down</h3>
      <ul>
        <li>Digital sunset 1 hour before bed</li>
        <li>Drink golden milk (turmeric milk)</li>
        <li>Practice meditation or gentle stretching</li>
        <li>Sleep by 10 PM for optimal restoration</li>
      </ul>`,
      excerpt: "Learn how to integrate simple Ayurvedic practices into your busy modern lifestyle for better health and happiness.",
      author: "Vedant Kumar",
      category: "Lifestyle",
      published: true,
      created_at: "2024-02-01T08:00:00Z"
    },
    {
      id: 3,
      title: "Understanding Your Dosha: Vata, Pitta, Kapha",
      slug: "understanding-doshas",
      content: `<p>In Ayurveda, understanding your unique constitution (Prakriti) is key to optimal health. The three doshas - Vata, Pitta, and Kapha - govern all physical and mental processes.</p>
      
      <h3>Vata Dosha</h3>
      <p><strong>Elements:</strong> Air + Ether</p>
      <p><strong>Characteristics:</strong> Creative, quick-thinking, energetic when balanced; anxious, restless when imbalanced</p>
      <p><strong>Balancing Foods:</strong> Warm, cooked, grounding foods like soups, stews, root vegetables</p>
      
      <h3>Pitta Dosha</h3>
      <p><strong>Elements:</strong> Fire + Water</p>
      <p><strong>Characteristics:</strong> Intelligent, driven, sharp; irritable, inflammatory when imbalanced</p>
      <p><strong>Balancing Foods:</strong> Cooling foods like coconut, cucumber, mint, sweet fruits</p>
      
      <h3>Kapha Dosha</h3>
      <p><strong>Elements:</strong> Earth + Water</p>
      <p><strong>Characteristics:</strong> Calm, loving, stable; lethargic, congested when imbalanced</p>
      <p><strong>Balancing Foods:</strong> Light, spicy, warming foods like ginger, chili, leafy greens</p>`,
      excerpt: "Discover which Ayurvedic dosha dominates your constitution and learn how to maintain perfect balance.",
      author: "Dr. Arun Patel",
      category: "Ayurveda Basics",
      published: true,
      created_at: "2024-02-15T14:00:00Z"
    }
  ];
}

// Export sample data for fallback
export { getSampleProducts, getSampleBlogPosts };

// ============================================================================
// EXPORT DEFAULT CONFIGURATION
// ============================================================================

export default {
  WORKER_URL,
  endpoints: {
    health: '/',
    users: '/api/users',
    blog: '/api/blog',
    products: '/api/products',
  }
};
