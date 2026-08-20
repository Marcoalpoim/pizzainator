import React, { useState, useEffect } from "react";
import Auth from "./components/Auth";
import "./index.css";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { lazy, Suspense } from "react";

const PizzaBuilder = lazy(() => import("./components/PizzaBuilder"));
const Feed = lazy(() => import("./components/Feed"));
const Profile = lazy(() => import("./components/Profile"));
const RecipePage = lazy(() => import("./components/RecipePage"));

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feed, setFeed] = useState([]);
  const [showConfig, setShowConfig] = useState(() => {
    const saved = localStorage.getItem("pizzaBuilderConfigOpen");
    return saved ? JSON.parse(saved) : true;
  });
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("bookmarks")) || [];
    } catch {
      return [];
    }
  });

    useEffect(() => {
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch (error) {
      console.error("Erro no AdSense:", error);
    }
  }, []);

  // ── Loading screen ──────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  // ── Listen to Firestore feed in real time ───────────────────────────────────
  useEffect(() => {
    const q = query(collection(db, "recipes"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const recipes = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setFeed(recipes);
    });
    return () => unsubscribe();
  }, []);

  // ── Persist non-critical state to localStorage ──────────────────────────────
  useEffect(() => {
    localStorage.setItem("pizzaBuilderConfigOpen", JSON.stringify(showConfig));
  }, [showConfig]);

  useEffect(() => {
    localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
  }, [bookmarks]);

  // ── Publish to Firestore ────────────────────────────────────────────────────
  const publishToFeed = async (recipe) => {
    const newPost = {
      ...recipe,
      author: user?.displayName || user?.name || "Anonymous Chef",
      userId: user?.uid || "guest",
      createdAt: new Date().toISOString(),
    };
    try {
      await addDoc(collection(db, "recipes"), newPost);
    } catch (err) {
      console.error("Erro ao publicar receita:", err);
    }
  };

  // ── Delete from Firestore ───────────────────────────────────────────────────
  const deletePublishedRecipe = async (id) => {
    try {
      await deleteDoc(doc(db, "recipes", id));
    } catch (err) {
      console.error("Erro ao apagar receita:", err);
    }
  };

  const handleLogout = () => setUser(null);

  const toggleBookmark = (id) => {
    setBookmarks((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id],
    );
  };

  if (loading) {
    return (
      <div className="loader-screen">
        <img
          src="/icons/loadingPI.gif"
          alt="Loading..."
          className="loader-gif"
          fetchpriority="high"
        />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="app-root">
        <Auth user={user} setUser={setUser} />

        {user && (
          <>
            <div className="brand-logo">
              <Link to="/">
                <img
                  src="/icons/logotipo-pizzainator.webp"
                  alt="Pizzainator"
                  width={104}
                  height={45}
                />
              </Link>
            </div>
           
          <ins
            className="adsbygoogle"
            style={{ display: "block" }}
            data-ad-client="ca-pub-9882665060686749"
            data-ad-slot="1234567890"
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
            <nav className="mainnav-container">
              <Link to="/">
                <img src="/icons/Home.svg" alt="Home" width={24} height={24} />
              </Link>
              <Link to="/feed">
                <img
                  src="/icons/Interface.svg"
                  alt="Feed"
                  width={24}
                  height={24}
                />
              </Link>
              <Link to="/profile">
                <img src="/icons/user.svg" alt="user" width={24} height={24} />
              </Link>
            </nav>

            <Suspense
              fallback={
                <div className="loader-screen">
                  <img
                    src="/icons/loadingPI.gif"
                    alt="Loading..."
                    className="loader-gif"
                  />
                </div>
              }
            >
              <Routes>
                <Route
                  path="/"
                  element={
                    <PizzaBuilder
                      user={user}
                      publishToFeed={publishToFeed}
                      showConfig={showConfig}
                      setShowConfig={setShowConfig}
                    />
                  }
                />
                <Route
                  path="/feed"
                  element={
                    <Feed
                      feed={feed}
                      bookmarks={bookmarks}
                      onBookmark={toggleBookmark}
                    />
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <Profile
                      user={user}
                      feed={feed}
                      bookmarks={bookmarks}
                      onToggleBookmark={toggleBookmark}
                      onDeletePublished={deletePublishedRecipe}
                      onLogout={handleLogout}
                    />
                  }
                />
                <Route
                  path="/recipe/:id"
                  element={
                    <RecipePage
                      feed={feed}
                      bookmarks={bookmarks}
                      onToggleBookmark={toggleBookmark}
                    />
                  }
                />
              </Routes>
            </Suspense>
          </>
        )}
      </div>
    </BrowserRouter>
  );
}
