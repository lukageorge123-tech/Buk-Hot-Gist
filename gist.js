// ==========================================
// HOT GIST BUK - FIREBASE GIST SYSTEM
// Corrected full version
// ==========================================

import { initializeApp } from
  "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged
} from
  "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  doc,
  updateDoc,
  increment,
  getDoc,
  setDoc,
  deleteDoc,
  runTransaction,
  orderBy,
  getDocs
} from
  "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

// ==========================================
// FIREBASE CONFIGURATION
// ==========================================

const firebaseConfig = {
  apiKey: "AIzaSyB3OTW__dTaKmI7wa1Afc7vzUwgfWBtMkg",
  authDomain: "buk-hot-gist.firebaseapp.com",
  projectId: "buk-hot-gist",
  storageBucket: "buk-hot-gist.firebasestorage.app",
  messagingSenderId: "108695342341",
  appId: "1:108695342341:web:fa1f0cc806b870f05abb6c",
  measurementId: "G-NP5M9XDGKJ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ==========================================
// SAMPLE POSTS
// ==========================================

const samplePosts = [
  {
    id: "sample-1",
    title: "2025/2026 Academic Calendar Revision Released",
    category: "Announcements",
    author: "Academic Affairs",
    date: "2 hours ago",
    content: "The university Senate has approved the updated academic schedule for the current semester. Mid-semester examinations will begin next month.",
    likes: 34,
    comments: 5,
    imageData: "",
    isSample: true,
    userLiked: false
  },
  {
    id: "sample-2",
    title: "Annual Faculty Innovation Grant Competition",
    category: "Scholarships",
    author: "Research Directorate",
    date: "Yesterday",
    content: "Applications are now open for student research projects focused on technology solutions. Winners will receive up to ₦200,000 funding.",
    likes: 89,
    comments: 12,
    imageData: "",
    isSample: true,
    userLiked: false
  },
  {
    id: "sample-3",
    title: "Inter-Faculty Football Championship Kicks Off",
    category: "Sports",
    author: "SUG Sports Director",
    date: "3 days ago",
    content: "The annual inter-faculty tournament begins this Friday at the Old Campus Main Pitch. Come support your respective faculty teams!",
    likes: 120,
    comments: 18,
    imageData: "",
    isSample: true,
    userLiked: false
  }
];

let gistPosts = [...samplePosts];
let selectedCategory = "All";
let currentUser = null;
let postsUnsubscribe = null;
const commentUnsubscribers = new Map();
const adminButton = document.getElementById("adminButton");

if (adminButton) {
  adminButton.hidden = true;

  onAuthStateChanged(auth, async (user) => {
    adminButton.hidden = true;

    if (!user) return;

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));

      const isSuperAdmin =
        user.email?.toLowerCase() === "georgeluka2023@gmail.com";

      const isRoleAdmin =
        userDoc.exists() && userDoc.data().role === "admin";

      adminButton.hidden = !(isSuperAdmin || isRoleAdmin);
    } catch (error) {
      console.error("Could not verify admin role:", error);
      adminButton.hidden = true;
    }
  });
}

// ==========================================
// NOTIFICATIONS
// ==========================================

async function createNotification({
  userId,
  type,
  title,
  message,
  postId = "",
  fromUserId = "",
  fromUserName = ""
}) {
  if (!userId) return;

  try {
    await addDoc(collection(db, "notifications"), {
      userId,
      type,
      title,
      message,
      postId,
      fromUserId,
      fromUserName,
      read: false,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error creating notification:", error);
  }
}

// ==========================================
// AUTHENTICATION
// ==========================================

onAuthStateChanged(auth, (user) => {
  if (!user) {
    currentUser = null;
    window.location.href = "login.html";
    return;
  }

  currentUser = user;
  loadApprovedPosts();
});

// ==========================================
// INITIAL PAGE RENDER
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  renderPosts();
});

// ==========================================
// LOAD APPROVED POSTS
// ==========================================

function loadApprovedPosts() {
  if (postsUnsubscribe) {
    postsUnsubscribe();
    postsUnsubscribe = null;
  }

  const container = document.getElementById("postsContainer");

  if (container) {
    container.innerHTML =
      '<p style="text-align:center;padding:20px;">Loading campus feed...</p>';
  }

  const postsRef = collection(db, "posts");

  const approvedPostsQuery = query(
    postsRef,
    where("status", "==", "approved")
  );

  postsUnsubscribe = onSnapshot(
    approvedPostsQuery,
    (snapshot) => {
      const firebasePosts = [];

      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();

        firebasePosts.push({
          id: docSnapshot.id,
          title: data.title || "",
          category: data.category || "General",
          author: data.authorName || "Student",
          date: formatDate(data.createdAt),
          content: data.content || "",
          likes: Number(data.likes || 0),
          comments: Number(data.comments || 0),
          imageData: data.imageData || "",
          createdAt: data.createdAt || null,
          isSample: false
        });
      });

      firebasePosts.sort((a, b) => {
        const dateA = a.createdAt?.toMillis?.() || 0;
        const dateB = b.createdAt?.toMillis?.() || 0;
        return dateB - dateA;
      });

      gistPosts = [...firebasePosts, ...samplePosts];

      renderPosts();
    },
    (error) => {
      console.error("FEED LOADING ERROR:", error);

      if (container) {
        container.innerHTML = `
          <p style="text-align:center;padding:20px;">
            Unable to load the campus feed.
          </p>
          <p style="text-align:center;font-size:13px;">
            ${escapeHTML(error.code || error.message || "Unknown Firebase error")}
          </p>
        `;
      }
    }
  );
}

// ==========================================
// DATE FORMATTER
// ==========================================

function formatDate(timestamp) {
  if (!timestamp || typeof timestamp.toDate !== "function") {
    return "Just now";
  }

  const date = timestamp.toDate();

  const difference = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 1000)
  );

  if (difference < 60) return "Just now";

  if (difference < 3600) {
    const minutes = Math.floor(difference / 60);
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  if (difference < 86400) {
    const hours = Math.floor(difference / 3600);
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(difference / 86400);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

// ==========================================
// HTML ESCAPING
// ==========================================

function escapeHTML(value) {
  const div = document.createElement("div");
  div.textContent = String(value ?? "");
  return div.innerHTML;
}

// ==========================================
// CHECK LIKE STATUS
// ==========================================

async function checkUserLiked(postId) {
  if (!currentUser || postId.startsWith("sample-")) {
    return false;
  }

  try {
    const likeRef = doc(
      db,
      "posts",
      postId,
      "likes",
      currentUser.uid
    );

    const likeSnapshot = await getDoc(likeRef);

    return likeSnapshot.exists();
  } catch (error) {
    console.error("Error checking like:", error);
    return false;
  }
}

// ==========================================
// RENDER POSTS
// ==========================================

async function renderPosts() {
  const container = document.getElementById("postsContainer");
  if (!container) return;

  const searchInput = document.getElementById("searchInput");

  const searchVal = searchInput
    ? searchInput.value.toLowerCase().trim()
    : "";

  container.innerHTML = "";

  const filtered = gistPosts.filter((post) => {
    const matchesCategory =
      selectedCategory === "All" ||
      post.category === selectedCategory;

    const matchesSearch =
      post.title.toLowerCase().includes(searchVal) ||
      post.content.toLowerCase().includes(searchVal) ||
      post.author.toLowerCase().includes(searchVal);

    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML =
      '<p style="text-align:center;padding:30px;">No posts found.</p>';
    return;
  }

  for (const post of filtered) {
    const card = document.createElement("div");
    card.className = "post-card";

    let userLiked = Boolean(post.userLiked);

    if (!post.isSample) {
      userLiked = await checkUserLiked(post.id);
    }

    const likeText = userLiked
      ? `💙 Liked (${post.likes})`
      : `❤️ Like (${post.likes})`;

    const imageHTML = post.imageData
      ? `<img src="${post.imageData}" alt="Gist image" class="gist-image">`
      : "";

    const showDelete =
      currentUser?.email === "georgeluka2023@gmail.com";

    card.innerHTML = `
      <div class="post-header">
        <span class="category-tag">${escapeHTML(post.category)}</span>
        <span class="post-meta">
          Posted by ${escapeHTML(post.author)} • ${escapeHTML(post.date)}
        </span>
      </div>

      ${imageHTML}

      <h4>${escapeHTML(post.title)}</h4>

      <p>${escapeHTML(post.content)}</p>

      <div class="post-actions">
        <button
          class="action-btn like-button"
          data-post-id="${escapeHTML(post.id)}">
          ${likeText}
        </button>

        <button
          class="action-btn comment-button"
          data-post-id="${escapeHTML(post.id)}">
          💬 Comment (${post.comments})
        </button>

        <button
          class="action-btn report-button"
          data-post-id="${escapeHTML(post.id)}">
          🚩 Report
        </button>
      </div>

      ${
        showDelete
          ? `<button class="action-btn delete-button" data-post-id="${escapeHTML(post.id)}">🗑️ Delete</button>`
          : ""
      }

      <div
        class="comments-section"
        id="comments-${escapeHTML(post.id)}"
        style="display:none;">

        <div class="comment-input-area">
          <textarea
            class="comment-input"
            id="comment-input-${escapeHTML(post.id)}"
            placeholder="Write a comment..."
            rows="3"></textarea>

          <button
            class="submit-comment-btn"
            data-post-id="${escapeHTML(post.id)}">
            Post Comment
          </button>
        </div>

        <div
          class="comments-list"
          id="comments-list-${escapeHTML(post.id)}">
          Open comments to load them.
        </div>
      </div>
    `;

    container.appendChild(card);

    card.querySelector(".like-button")
      ?.addEventListener("click", () => likePost(post.id));

    card.querySelector(".comment-button")
      ?.addEventListener("click", () => toggleComments(post.id));

    card.querySelector(".delete-button")
      ?.addEventListener("click", () => deleteFeedPost(post.id));

    card.querySelector(".submit-comment-btn")
      ?.addEventListener("click", () => submitComment(post.id));

    card.querySelector(".report-button")
      ?.addEventListener("click", () => {
        alert(
          "To report a post, please contact the Hot Gist BUK administrator."
        );
      });
  }
}

// ==========================================
// LIKE / UNLIKE POST
// ==========================================

async function likePost(postId) {
  if (!currentUser) {
    alert("Please login before liking a gist.");
    return;
  }

  // Handle sample posts locally.
  if (postId.startsWith("sample-")) {
    const post = gistPosts.find((item) => item.id === postId);
    if (!post) return;

    if (post.userLiked) {
      post.likes = Math.max(0, post.likes - 1);
      post.userLiked = false;
    } else {
      post.likes += 1;
      post.userLiked = true;
    }

    renderPosts();
    return;
  }

  try {
    const likeRef = doc(
      db,
      "posts",
      postId,
      "likes",
      currentUser.uid
    );

    const postRef = doc(db, "posts", postId);

    let didLike = false;

    await runTransaction(db, async (transaction) => {
      const likeSnapshot = await transaction.get(likeRef);
      const postSnapshot = await transaction.get(postRef);

      if (!postSnapshot.exists()) {
        throw new Error("Post does not exist.");
      }

      const currentLikes = Number(
        postSnapshot.data().likes || 0
      );

      if (likeSnapshot.exists()) {
        transaction.delete(likeRef);

        transaction.update(postRef, {
          likes: Math.max(0, currentLikes - 1)
        });

        didLike = false;
      } else {
        transaction.set(likeRef, {
          userId: currentUser.uid,
          userName: currentUser.displayName || "Student",
          createdAt: serverTimestamp()
        });

        transaction.update(postRef, {
          likes: currentLikes + 1
        });

        didLike = true;
      }
    });

    // Notify the author only when the user adds a like.
    if (didLike) {
      const postSnapshot = await getDoc(postRef);

      if (postSnapshot.exists()) {
        const postData = postSnapshot.data();

        if (
          postData.authorId &&
          postData.authorId !== currentUser.uid
        ) {
          await createNotification({
            userId: postData.authorId,
            type: "like",
            title: "New Like",
            message: `${currentUser.displayName || "A student"} liked your gist.`,
            postId,
            fromUserId: currentUser.uid,
            fromUserName: currentUser.displayName || "Student"
          });
        }
      }
    }

    await renderPosts();
  } catch (error) {
    console.error("Error liking/unliking post:", error);

    alert("Unable to update your like. Please try again.");
  }
}

// ==========================================
// ADMIN DELETE POST, COMMENTS AND LIKES
// ==========================================

window.deleteFeedPost = async function (postId) {
  if (!currentUser) {
    alert("Please login first.");
    return;
  }

  if (postId.startsWith("sample-")) {
    alert("Sample posts cannot be deleted from Firebase.");
    return;
  }

  try {
    const userSnapshot = await getDoc(
      doc(db, "users", currentUser.uid)
    );

    if (
      !userSnapshot.exists() ||
      userSnapshot.data().role !== "admin"
    ) {
      alert("Access denied. Admins only.");
      return;
    }

    const confirmed = confirm(
      "PERMANENT DELETE\n\n" +
      "This will delete the post and its comments and likes.\n\n" +
      "Continue?"
    );

    if (!confirmed) return;

    // Delete all likes belonging to the post.
    const likesSnapshot = await getDocs(
      collection(db, "posts", postId, "likes")
    );

    for (const likeDoc of likesSnapshot.docs) {
      await deleteDoc(likeDoc.ref);
    }

    // Delete all comments belonging to the post.
    const commentsSnapshot = await getDocs(
      collection(db, "posts", postId, "comments")
    );

    for (const commentDoc of commentsSnapshot.docs) {
      await deleteDoc(commentDoc.ref);
    }

    // Finally, delete the post itself.
    await deleteDoc(doc(db, "posts", postId));

    alert("Post, likes, and comments deleted successfully.");
  } catch (error) {
    console.error("DELETE ERROR:", error);

    alert(
      "Delete failed: " +
      (error.code || error.message || "Unknown error")
    );
  }
};

// ==========================================
// TOGGLE COMMENTS
// ==========================================

function toggleComments(postId) {
  const section = document.getElementById(
    `comments-${postId}`
  );

  if (!section) return;

  if (section.style.display === "none") {
    section.style.display = "block";
    loadComments(postId);
  } else {
    section.style.display = "none";
  }
}

// ==========================================
// LOAD COMMENTS
// ==========================================

function loadComments(postId) {
  const commentsList = document.getElementById(
    `comments-list-${postId}`
  );

  if (!commentsList) return;

  // Prevent duplicate live listeners for the same post.
  if (commentUnsubscribers.has(postId)) {
    commentUnsubscribers.get(postId)();
    commentUnsubscribers.delete(postId);
  }

  if (postId.startsWith("sample-")) {
    commentsList.innerHTML =
      '<p class="no-comments">Comments are available on published student gists.</p>';
    return;
  }

  const commentsRef = collection(
    db,
    "posts",
    postId,
    "comments"
  );

  const commentsQuery = query(
    commentsRef,
    orderBy("createdAt", "desc")
  );

  const unsubscribe = onSnapshot(
    commentsQuery,
    (snapshot) => {
      commentsList.innerHTML = "";

      if (snapshot.empty) {
        commentsList.innerHTML =
          '<p class="no-comments">No comments yet. Be the first to comment.</p>';
        return;
      }

      snapshot.forEach((commentDoc) => {
        const comment = commentDoc.data();

        const commentElement = document.createElement("div");
        commentElement.className = "comment-item";

        commentElement.innerHTML = `
          <div class="comment-author">
            ${escapeHTML(comment.authorName || "Student")}
          </div>

          <div class="comment-text">
            ${escapeHTML(comment.text || "")}
          </div>

          <div class="comment-date">
            ${escapeHTML(formatDate(comment.createdAt))}
          </div>
        `;

        commentsList.appendChild(commentElement);
      });
    },
    (error) => {
      console.error("Error loading comments:", error);

      commentsList.innerHTML =
        '<p class="no-comments">Unable to load comments. Check Firestore rules.</p>';
    }
  );

  commentUnsubscribers.set(postId, unsubscribe);
}

// ==========================================
// SUBMIT COMMENT
// ==========================================

async function submitComment(postId) {
    try {
        // 1. Make sure the student is logged in
        if (!currentUser) {
            alert("Please log in before commenting.");
            return;
        }

        // 2. Make sure this is a real post
        if (!postId || postId.startsWith("sample-")) {
            alert("You cannot comment on a sample gist.");
            return;
        }

        // 3. Get the comment input
        const input = document.getElementById(
            `comment-input-${postId}`
        );

        if (!input) {
            alert("Comment box not found. Please refresh the page.");
            return;
        }

        const commentText = input.value.trim();

        // 4. Validate the comment
        if (!commentText) {
            alert("Please type a comment first.");
            return;
        }

        if (commentText.length > 500) {
            alert("Your comment cannot exceed 500 characters.");
            return;
        }

        // 5. Check that the post exists and is approved
        const postRef = doc(db, "posts", postId);
        const postSnapshot = await getDoc(postRef);

        if (!postSnapshot.exists()) {
            alert("This gist could not be found.");
            return;
        }

        const postData = postSnapshot.data();

        if (postData.status !== "approved") {
            alert("Comments are available only on approved gists.");
            return;
        }

        // 6. Save the comment in its own document
        const commentsRef = collection(
            db,
            "posts",
            postId,
            "comments"
        );

        await addDoc(commentsRef, {
            text: commentText,
            authorId: currentUser.uid,
            authorName:
                currentUser.displayName || "Student",
            authorEmail: currentUser.email || "",
            createdAt: serverTimestamp()
        });

        // 7. Clear the input after saving successfully
        input.value = "";

        // 8. Refresh the displayed comments
        await loadComments(postId);

        alert("Comment posted successfully!");

    } catch (error) {
        console.error("Error submitting comment:", error);

        if (
            error.code === "permission-denied" ||
            error.code === "firestore/permission-denied"
        ) {
            alert(
                "Permission denied. Check that you are logged in, " +
                "the gist status is approved, and your Firestore rules are published."
            );
        } else {
            alert(
                "Unable to post comment: " +
                (error.message || "Unknown error")
            );
        }
    }
}





// ==========================================
// CATEGORY AND SEARCH
// ==========================================

function selectCategory(category) {
  selectedCategory = category;

  document.querySelectorAll(".pill").forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.category === category
    );
  });

  renderPosts();
}

function filterPosts() {
  renderPosts();
}

// ==========================================
// CREATE POST MODAL
// ==========================================

function openModal() {
  const modal = document.getElementById("postModal");

  if (modal) {
    modal.style.display = "flex";
  }
}

function closeModal() {
  const modal = document.getElementById("postModal");

  if (modal) {
    modal.style.display = "none";
  }
}

function openCreatePost() {
  openModal();
}

// ==========================================
// IMAGE COMPRESSION
// ==========================================

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");

        const maxWidth = 900;
        const maxHeight = 900;

        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }

        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }

        canvas.width = Math.round(width);
        canvas.height = Math.round(height);

        const context = canvas.getContext("2d");

        if (!context) {
          reject(new Error("Unable to prepare image canvas."));
          return;
        }

        context.drawImage(
          img,
          0,
          0,
          canvas.width,
          canvas.height
        );

        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };

      img.onerror = () => {
        reject(new Error("Unable to process image."));
      };

      img.src = event.target.result;
    };

    reader.onerror = () => {
      reject(new Error("Unable to read image."));
    };

    reader.readAsDataURL(file);
  });
}

// ==========================================
// SUBMIT NEW GIST
// ==========================================

async function handlePostSubmit(event) {
  event.preventDefault();

  const titleElement = document.getElementById("postTitle");
  const categoryElement = document.getElementById("postCategory");
  const contentElement = document.getElementById("postContent");
  const mediaElement = document.getElementById("postMedia");

  if (!titleElement || !categoryElement || !contentElement) {
    alert("Post form could not be found.");
    return;
  }

  const title = titleElement.value.trim();
  const category = categoryElement.value;
  const content = contentElement.value.trim();
  const mediaFile = mediaElement?.files?.[0] || null;
  const user = auth.currentUser;

  if (!user) {
    alert("Please login before submitting a gist.");
    window.location.href = "login.html";
    return;
  }

  if (!title || !category || !content) {
    alert("Please fill in all the required fields.");
    return;
  }

  let imageData = "";

  if (mediaFile) {
    if (mediaFile.size > 5 * 1024 * 1024) {
      alert("Please choose an image smaller than 5MB.");
      return;
    }

    try {
      imageData = await compressImage(mediaFile);
    } catch (error) {
      console.error("Image processing error:", error);
      alert("Unable to process the selected image.");
      return;
    }
  }

  try {
    await addDoc(collection(db, "posts"), {
      title,
      category,
      content,
      authorId: user.uid,
      authorName: user.displayName || "Student",
      authorEmail: user.email || "",
      status: "pending",
      likes: 0,
      comments: 0,
      imageData,
      createdAt: serverTimestamp()
    });

    document.getElementById("postForm")?.reset();

    closeModal();

    alert(
      "Your gist has been submitted successfully and is waiting for admin approval."
    );
  } catch (error) {
    console.error("Error submitting post:", error);

    alert(
      "Unable to submit your gist: " +
      (error.code || error.message || "Please try again.")
    );
  }
}

// ==========================================
// NAVIGATION FUNCTIONS
// ==========================================

function goToDashboard() {
  window.location.href = "dashboard.html";
}

function goToProfile() {
  window.location.href = "profile.html";
}

function goToAdmin() {
  window.location.href = "admin.html";
}

// ==========================================
// PAGE EVENT LISTENERS
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("createPostBtn")
    ?.addEventListener("click", openCreatePost);

  document
    .getElementById("closeModalBtn")
    ?.addEventListener("click", closeModal);

  document
    .getElementById("postForm")
    ?.addEventListener("submit", handlePostSubmit);

  document
    .getElementById("searchInput")
    ?.addEventListener("input", filterPosts);

  document.querySelectorAll(".pill").forEach((button) => {
    button.addEventListener("click", () => {
      selectCategory(button.dataset.category);
    });
  });

  document
    .getElementById("dashboardBtn")
    ?.addEventListener("click", goToDashboard);

  document
    .getElementById("profileBtn")
    ?.addEventListener("click", goToProfile);

  document
    .getElementById("adminBtn")
    ?.addEventListener("click", goToAdmin);
});

// ==========================================
// MAKE FUNCTIONS AVAILABLE TO HTML
// ==========================================

window.openModal = openModal;
window.closeModal = closeModal;
window.openCreatePost = openCreatePost;
window.selectCategory = selectCategory;
window.filterPosts = filterPosts;
window.goToDashboard = goToDashboard;
window.goToProfile = goToProfile;
window.goToAdmin = goToAdmin;

