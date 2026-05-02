import { useEffect, useMemo, useState } from "react";
import "./Blog.css";

const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

const starterPosts = [
  {
    id: 1,
    title: "How I Spent 6 Days in Himachal Under Rs 14,000",
    excerpt:
      "A practical backpacking route covering transport hacks, budget hostels, and offline maps that saved both time and money.",
    story:
      "I planned this trip with one rule: never book at the last minute. I traveled overnight by bus, used shared cabs only for mountain stretches, and picked hostels within walking distance of bus points. For food, I focused on local cafes and fixed one daily budget cap. I tracked every expense in notes and adjusted the next day based on overages. That one habit reduced waste dramatically. I also downloaded offline maps and marked low-cost clinics, ATMs, and bus stands in advance. The result was a smooth six-day itinerary that felt flexible and still stayed under budget.",
    author: "Nisha Varma",
    date: "2026-02-03",
    category: "Budget",
    location: "India",
    readTime: "6 min read",
    likes: 48,
    comments: 9,
    image:
      "https://images.unsplash.com/photo-1464822759844-d150ad6d1d35?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 2,
    title: "Backpacking Kyoto: Quiet Neighborhoods Beyond the Tourist Core",
    excerpt:
      "If you want temples without crowd fatigue, these early-morning routes and local guesthouses make all the difference.",
    story:
      "Kyoto becomes easier when you invert the timing of your day. I started at sunrise in less crowded neighborhoods, visited major sites only during transition windows, and used side streets to avoid heavy routes. I stayed in a guesthouse near a local train line, not in the center, and that cut both costs and noise. Evening walks through neighborhood bakeries and public baths gave me a stronger local experience than typical tourist loops. If you are carrying a backpack and working with fixed funds, these small route decisions matter more than expensive passes.",
    author: "Arjun Menon",
    date: "2026-01-22",
    category: "Guides",
    location: "Japan",
    readTime: "8 min read",
    likes: 65,
    comments: 14,
    image:
      "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 3,
    title: "Remote Work + Backpacking: My 30-Day Setup That Actually Works",
    excerpt:
      "From SIM redundancy to cafe routines, this setup kept meetings stable while staying under a strict daily budget.",
    story:
      "For one month, I tested a working backpacker setup across three cities. My system was simple: one primary SIM, one backup eSIM, power bank rotation, and a strict location checklist before every call. I preferred coworking day passes only on meeting-heavy days and used cafes with morning seat availability for deep work. I carried a folding stand and compact keyboard to avoid neck strain and productivity drops. The important part was planning internet fallback first, not accommodation aesthetics. This setup kept delivery quality high while preserving travel flexibility.",
    author: "Farah Khan",
    date: "2026-01-10",
    category: "Remote Work",
    location: "Portugal",
    readTime: "7 min read",
    likes: 37,
    comments: 8,
    image:
      "https://images.unsplash.com/photo-1522199710521-72d69614c702?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 4,
    title: "48 Hours in Istanbul: A Backpacker Food Route",
    excerpt:
      "Street food, ferries, and old-city walks organized by neighborhoods so you can avoid expensive detours.",
    story:
      "Istanbul can be overwhelming if you bounce between distant districts. I grouped my route by ferry lines and walked through food streets close to each stop. I avoided tourist menus, checked local queues, and prioritized places with transparent pricing. A short evening ferry gave me both transport and skyline views at a low cost. I kept a two-day plan with fallback options for rain and energy levels. That balance helped me enjoy more neighborhoods without blowing my budget.",
    author: "Karan Das",
    date: "2025-12-29",
    category: "Food",
    location: "Turkey",
    readTime: "5 min read",
    likes: 29,
    comments: 6,
    image:
      "https://images.unsplash.com/photo-1527838832700-5059252407fa?auto=format&fit=crop&w=1200&q=80",
  },
];

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function estimateReadTime(text) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const mins = Math.max(2, Math.ceil(words / 180));
  return `${mins} min read`;
}

function toStory(post) {
  if (post.story) {
    return post.story;
  }
  return post.excerpt || "";
}

export default function Blog({ user }) {
  const [communityPosts, setCommunityPosts] = useState([]);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftLocation, setDraftLocation] = useState("");
  const [draftStory, setDraftStory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("popular");
  const [selectedPost, setSelectedPost] = useState(null);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postsError, setPostsError] = useState("");
  const [publishStatus, setPublishStatus] = useState("");
  const [deleteStatus, setDeleteStatus] = useState("");
  const [deletingPostId, setDeletingPostId] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadPosts = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/blog-posts`);
        if (!response.ok) {
          throw new Error("Unable to load posts");
        }

        const data = await response.json();
        if (isMounted) {
          const normalized = (data.posts || []).map((post) => ({
            ...post,
            story: toStory(post),
            readTime: post.readTime || estimateReadTime(toStory(post)),
          }));
          setCommunityPosts(normalized);
          setPostsError("");
        }
      } catch {
        if (isMounted) {
          setPostsError("Could not load community posts right now.");
        }
      } finally {
        if (isMounted) {
          setLoadingPosts(false);
        }
      }
    };

    loadPosts();

    return () => {
      isMounted = false;
    };
  }, []);

  const allPosts = useMemo(() => [...communityPosts, ...starterPosts], [communityPosts]);

  const categories = useMemo(() => {
    const dynamicCategories = Array.from(new Set(allPosts.map((post) => post.category)));
    return ["All", ...dynamicCategories];
  }, [allPosts]);

  const filteredPosts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return allPosts
      .filter((post) => {
        const story = toStory(post);
        const matchesCategory = activeCategory === "All" || post.category === activeCategory;
        const matchesSearch =
          query.length === 0 ||
          post.title.toLowerCase().includes(query) ||
          post.excerpt.toLowerCase().includes(query) ||
          story.toLowerCase().includes(query) ||
          post.location.toLowerCase().includes(query) ||
          post.author.toLowerCase().includes(query);

        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === "popular") {
          return b.likes + b.comments - (a.likes + a.comments);
        }
        return new Date(b.date) - new Date(a.date);
      });
  }, [allPosts, activeCategory, searchTerm, sortBy]);

  const featuredPost = filteredPosts[0];
  const listPosts = filteredPosts.slice(1);

  const trendingPosts = useMemo(() => {
    return [...allPosts]
      .sort((a, b) => b.likes + b.comments - (a.likes + a.comments))
      .slice(0, 4);
  }, [allPosts]);

  const draftWordCount = useMemo(() => {
    return draftStory.trim().split(/\s+/).filter(Boolean).length;
  }, [draftStory]);

  const draftReadTime = useMemo(() => {
    return estimateReadTime(draftStory || "");
  }, [draftStory]);

  const draftChecklist = useMemo(() => {
    return [
      { label: "Headline written", done: draftTitle.trim().length > 5 },
      { label: "Location added", done: draftLocation.trim().length > 0 },
      { label: "Story has 120+ words", done: draftWordCount >= 120 },
      { label: "Clear ending", done: /finally|overall|in short|in summary/i.test(draftStory) },
    ];
  }, [draftTitle, draftLocation, draftStory, draftWordCount]);

  const openPost = (post) => {
    setSelectedPost(post);
  };

  const closePost = () => {
    setSelectedPost(null);
  };

  const canDeletePost = (post) => Boolean(user && post.authorUid && post.authorUid === user.uid);

  const deleteStory = async (postId) => {
    if (!user) {
      setDeleteStatus("Please log in to delete your story.");
      return;
    }

    const targetPost = communityPosts.find((post) => String(post.id) === String(postId));
    if (!targetPost || targetPost.authorUid !== user.uid) {
      setDeleteStatus("You can delete only your own community posts.");
      return;
    }

    const shouldDelete = window.confirm("Delete this post permanently?");
    if (!shouldDelete) {
      return;
    }

    setDeletingPostId(postId);
    setDeleteStatus("");

    try {
      const response = await fetch(`${apiBaseUrl}/api/blog-posts/${postId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ authorUid: user.uid }),
      });

      if (!response.ok) {
        throw new Error("Unable to delete post");
      }

      setCommunityPosts((prev) => prev.filter((post) => String(post.id) !== String(postId)));
      if (selectedPost && String(selectedPost.id) === String(postId)) {
        closePost();
      }
      setDeleteStatus("Post deleted successfully.");
    } catch {
      setDeleteStatus("Could not delete this post right now.");
    } finally {
      setDeletingPostId(null);
    }
  };

  const addStory = async () => {
    if (!user) {
      setPublishStatus("Please log in to publish your story.");
      return;
    }

    if (!draftTitle.trim() || !draftLocation.trim() || !draftStory.trim()) {
      setPublishStatus("Please fill all fields before publishing.");
      return;
    }

    const authorName = user.displayName || user.email || "Traveler";

    try {
      const payload = {
        title: draftTitle.trim(),
        story: draftStory.trim(),
        location: draftLocation.trim(),
        author: authorName,
        authorUid: user.uid,
      };

      const response = await fetch(`${apiBaseUrl}/api/blog-posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Unable to publish");
      }

      const data = await response.json();
      const savedPost = {
        ...data.post,
        story: toStory(data.post),
        readTime: data.post.readTime || estimateReadTime(toStory(data.post)),
      };

      setCommunityPosts((prev) => [savedPost, ...prev]);
      setDraftTitle("");
      setDraftLocation("");
      setDraftStory("");
      setPublishStatus("Published successfully. It is now visible to all users.");
      setDeleteStatus("");
    } catch {
      setPublishStatus("Publishing failed. Please try again.");
    }
  };

  return (
    <main className="blog-page">
      <section className="blog-hero">
        <p className="eyebrow">Editorial Desk</p>
        <h1>TravelTrove Journal</h1>
        <p className="hero-copy">
          Practical travel stories, cost breakdowns, and route-level insights for backpackers.
          Built for real trips, real budgets, and fewer surprises.
        </p>
      </section>

      <section className="blog-controls">
        <div className="search-wrap">
          <input
            type="text"
            placeholder="Search by title, location, author"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <div className="sort-wrap">
          <label htmlFor="sort-select">Sort</label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
          >
            <option value="latest">Latest</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>
      </section>

      <section className="category-row">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className={`chip ${activeCategory === category ? "active" : ""}`}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </section>

      {deleteStatus && <p className="inline-note">{deleteStatus}</p>}

      {featuredPost && (
        <section
          className="featured-post clickable"
          role="button"
          tabIndex={0}
          onClick={() => openPost(featuredPost)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              openPost(featuredPost);
            }
          }}
        >
          <img src={featuredPost.image} alt={featuredPost.title} />
          <div className="featured-body">
            <p className="meta">
              {featuredPost.category} | {featuredPost.location}
            </p>
            <h2>{featuredPost.title}</h2>
            <p>{featuredPost.excerpt}</p>
            <div className="post-foot">
              <span>{featuredPost.author}</span>
              <span>{formatDate(featuredPost.date)}</span>
              <span>{featuredPost.readTime}</span>
              {canDeletePost(featuredPost) && (
                <button
                  type="button"
                  className="delete-post-btn"
                  onClick={(event) => {
                    event.stopPropagation();
                    deleteStory(featuredPost.id);
                  }}
                  disabled={deletingPostId === featuredPost.id}
                >
                  {deletingPostId === featuredPost.id ? "Deleting..." : "Delete"}
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="blog-layout">
        <aside className="blog-sidebar-left">
          <section className="panel">
            <h3>Trending</h3>
            {trendingPosts.map((post) => (
              <button type="button" className="trend-item" key={post.id} onClick={() => openPost(post)}>
                <p className="trend-title">{post.title}</p>
                <span>{post.likes + post.comments} interactions</span>
                <span className="trend-meta">{post.location} | {post.readTime}</span>
              </button>
            ))}
          </section>
        </aside>

        <div className="post-grid">
          {loadingPosts && <p className="empty-state">Loading community stories...</p>}
          {postsError && <p className="empty-state">{postsError}</p>}

          {listPosts.map((post) => (
            <article
              className="post-card clickable"
              key={post.id}
              role="button"
              tabIndex={0}
              onClick={() => openPost(post)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  openPost(post);
                }
              }}
            >
              <img src={post.image} alt={post.title} />
              <div className="post-content">
                <p className="meta">
                  {post.category} | {post.location}
                </p>
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
                <div className="post-foot">
                  <span>{post.author}</span>
                  <span>{formatDate(post.date)}</span>
                  <span>{post.readTime}</span>
                  {canDeletePost(post) && (
                    <button
                      type="button"
                      className="delete-post-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        deleteStory(post.id);
                      }}
                      disabled={deletingPostId === post.id}
                    >
                      {deletingPostId === post.id ? "Deleting..." : "Delete"}
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}

          {!loadingPosts && filteredPosts.length === 0 && (
            <p className="empty-state">No posts found for your current filters.</p>
          )}
        </div>

        <aside className="blog-sidebar-right">
          <section className="panel">
            <h3>Writing Toolkit</h3>
            <p>Use this checklist before publishing your story.</p>
            <div className="writer-stats">
              <span>{draftWordCount} words</span>
              <span>{draftReadTime}</span>
            </div>
            <div className="checklist">
              {draftChecklist.map((item) => (
                <div className="check-item" key={item.label}>
                  <span className={item.done ? "dot done" : "dot"} />
                  <p>{item.label}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="panel compose-panel">
            <h3>Publish Your Story</h3>
            {!user && (
              <p className="inline-note warning-note">
                Login required to publish. You can still read all stories.
              </p>
            )}
            <input
              type="text"
              placeholder="Story title"
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              disabled={!user}
            />
            <input
              type="text"
              placeholder="Country"
              value={draftLocation}
              onChange={(event) => setDraftLocation(event.target.value)}
              disabled={!user}
            />
            <textarea
              placeholder="Write your full travel story"
              value={draftStory}
              onChange={(event) => setDraftStory(event.target.value)}
              disabled={!user}
            />
            <button type="button" className="action-btn" onClick={addStory} disabled={!user}>
              Publish
            </button>
            <div className="story-preview">
              <h4>Preview</h4>
              <p>
                {draftStory.trim()
                  ? draftStory.trim().slice(0, 180)
                  : "Your opening lines will appear here before publishing."}
                {draftStory.trim().length > 180 ? "..." : ""}
              </p>
            </div>
            {publishStatus && <p className="inline-note">{publishStatus}</p>}
          </section>
        </aside>
      </section>

      {selectedPost && (
        <div className="story-modal-backdrop" onClick={closePost}>
          <article className="story-modal" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="close-btn" onClick={closePost}>
              Close
            </button>
            <img src={selectedPost.image} alt={selectedPost.title} />
            <p className="meta">
              {selectedPost.category} | {selectedPost.location}
            </p>
            <h2>{selectedPost.title}</h2>
            <div className="post-foot">
              <span>{selectedPost.author}</span>
              <span>{formatDate(selectedPost.date)}</span>
              <span>{selectedPost.readTime}</span>
              {canDeletePost(selectedPost) && (
                <button
                  type="button"
                  className="delete-post-btn"
                  onClick={() => deleteStory(selectedPost.id)}
                  disabled={deletingPostId === selectedPost.id}
                >
                  {deletingPostId === selectedPost.id ? "Deleting..." : "Delete"}
                </button>
              )}
            </div>
            <p className="story-text">{toStory(selectedPost)}</p>
          </article>
        </div>
      )}
    </main>
  );
}
