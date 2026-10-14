import { initializeApp } from
"https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    signOut
} from
"https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc,
    collection,
    query,
    where,
    onSnapshot,
    updateDoc,
    deleteDoc
} from
"https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

const SUPER_ADMIN_EMAIL = "georgeluka2023@gmail.com";
const firebaseConfig = {

    apiKey:
    "AIzaSyB3OTW__dTaKmI7wa1Afc7vzUwgfWBtMkg",

    authDomain:
    "buk-hot-gist.firebaseapp.com",

    projectId:
    "buk-hot-gist",

    storageBucket:
    "buk-hot-gist.firebasestorage.app",

    messagingSenderId:
    "108695342341",

    appId:
    "1:108695342341:web:fa1f0cc806b870f05abb6c",

    measurementId:
    "G-NP5M9XDGKJ"

};


const app =
    initializeApp(firebaseConfig);

const auth =
    getAuth(app);

const db =
    getFirestore(app);


const loading =
    document.getElementById("loading");

const dashboard =
    document.getElementById("dashboard");

const accessDenied =
    document.getElementById("accessDenied");


/* =====================================
   CHECK ADMIN
===================================== */

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "login.html";

            return;
        }


        try {

            const userRef =
                doc(
                    db,
                    "users",
                    user.uid
                );


            const userSnapshot =
                await getDoc(userRef);


            if (!userSnapshot.exists()) {

                showAccessDenied();

                return;
            }


            const userData =
                userSnapshot.data();


            if (userData.role !== "admin") {

                showAccessDenied();

                return;
            }


            // ADMIN VERIFIED

            loading.style.display =
                "none";

            dashboard.style.display =
                "block";
    const isSuperAdmin =
    user.email === SUPER_ADMIN_EMAIL;

if (!isSuperAdmin) {

    document.getElementById("teamManagement").style.display =
        "none";

}

            loadPendingPosts();

            loadStatistics();
            loadAdmins();


        } catch (error) {

            console.error(error);

            showAccessDenied();

        }

    }
);


/* =====================================
   ACCESS DENIED
===================================== */

function showAccessDenied() {

    loading.style.display =
        "none";

    dashboard.style.display =
        "none";

    accessDenied.style.display =
        "block";

}


/* =====================================
   LOAD PENDING POSTS
===================================== */

function loadPendingPosts() {

    const postsRef =
        collection(db, "posts");


    const pendingQuery =
        query(
            postsRef,
            where(
                "status",
                "==",
                "pending"
            )
        );


    onSnapshot(
        pendingQuery,
        (snapshot) => {

            const container =
                document.getElementById(
                    "pendingPosts"
                );


            container.innerHTML = "";


            document.getElementById(
                "pendingCount"
            ).textContent =
                snapshot.size;


            if (snapshot.empty) {

                container.innerHTML =
                    "<p>No pending submissions.</p>";

                return;

            }


            snapshot.forEach(
                (postSnapshot) => {

                    const post =
                        postSnapshot.data();


                    const card =
                        document.createElement(
                            "div"
                        );


                    card.className =
                        "post-card";


                    card.innerHTML = `

                        <h3>
                            ${escapeHTML(
                                post.title
                            )}
                        </h3>

                        <p>
                            ${escapeHTML(
                                post.content
                            )}
                        </p>

                        <div class="post-info">

                            Category:
                            ${escapeHTML(
                                post.category
                            )}

                            <br>

                            Author:
                            ${escapeHTML(
                                post.authorName ||
                                "Unknown"
                            )}

                            <br>

                            Email:
                            ${escapeHTML(
                                post.authorEmail ||
                                "Not available"
                            )}

                        </div>

                        <br>

                        <button
                            class="approve"
                            onclick="approvePost('${postSnapshot.id}')">

                            Approve

                        </button>

                        <button
                            class="reject"
                            onclick="rejectPost('${postSnapshot.id}')">

                            Reject

                        </button>
                    

                    `;


                    container.appendChild(
                        card
                    );

                }
            );

        }
    );

}


/* =====================================
   APPROVE POST
===================================== */

window.approvePost =
    async function(postId) {

        try {

            await updateDoc(
                doc(
                    db,
                    "posts",
                    postId
                ),
                {
                    status: "approved"
                }
            );


            alert(
                "Post approved successfully!"
            );


        } catch (error) {

            console.error(error);

            alert(
                "Unable to approve post."
            );

        }

    };

window.deletePost = async function(postId) {
  const confirmed = confirm(
    "⚠️ PERMANENT DELETE\n\n" +
    "Are you sure you want to permanently delete this post?\n\n" +
    "This action cannot be undone."
  );

  if (!confirmed) return;

  try {
    await deleteDoc(doc(db, "posts", postId));

    alert("Post permanently deleted.");
  } catch (error) {
    console.error("Error deleting post:", error);
    alert("Failed to delete post.");
  }
};

/* =====================================
   REJECT POST
===================================== */

window.rejectPost =
    async function(postId) {

        try {

            await updateDoc(
                doc(
                    db,
                    "posts",
                    postId
                ),
                {
                    status: "rejected"
                }
            );


            alert(
                "Post rejected."
            );


        } catch (error) {

            console.error(error);

            alert(
                "Unable to reject post."
            );

        }

    };
    
     window.deleteFeedPost = async function(postId) {
  if (!currentUser) {
    alert("Please log in first.");
    return;
  }

  const confirmed = confirm(
    "⚠️ PERMANENT DELETE\n\n" +
    "Are you sure you want to permanently delete this post?\n\n" +
    "This action cannot be undone."
  );

  if (!confirmed) return;

  try {
    const userDoc = await getDoc(doc(db, "users", currentUser.uid));

    if (!userDoc.exists() || userDoc.data().role !== "admin") {
      alert("Access denied. Admins only.");
      return;
    }

    await deleteDoc(doc(db, "posts", postId));

    alert("Post permanently deleted.");
  } catch (error) {
    console.error("Error deleting feed post:", error);
    alert("Failed to delete post.");
  }
};

/* =====================================
   STATISTICS
===================================== */

function loadStatistics() {

    const usersRef =
        collection(db, "users");


    onSnapshot(
        usersRef,
        (snapshot) => {

            document.getElementById(
                "userCount"
            ).textContent =
                snapshot.size;

        }
    );


    const approvedQuery =
        query(
            collection(db, "posts"),
            where(
                "status",
                "==",
                "approved"
            )
        );


    onSnapshot(
        approvedQuery,
        (snapshot) => {

            document.getElementById(
                "approvedCount"
            ).textContent =
                snapshot.size;

        }
    );

}


/* =====================================
   LOGOUT
===================================== */

document
    .getElementById("logoutBtn")
    .addEventListener(
        "click",
        async () => {

            await signOut(auth);

            window.location.href =
                "login.html";

        }
    );


/* =====================================
   SECURITY: ESCAPE HTML
===================================== */

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value || "";

    return div.innerHTML;

}
/* =====================================
   TEAM MANAGEMENT
===================================== */

function loadAdmins() {

    const adminsQuery = query(
        collection(db, "users"),
        where("role", "==", "admin")
    );

    onSnapshot(
        adminsQuery,
        (snapshot) => {

            const container =
                document.getElementById("adminList");

            container.innerHTML = "";

            if (snapshot.empty) {

                container.innerHTML =
                    "<p>No administrators found.</p>";

                return;
            }

            snapshot.forEach((adminSnapshot) => {

                const admin =
                    adminSnapshot.data();

                const card =
                    document.createElement("div");

                card.style.padding = "15px";
                card.style.marginBottom = "10px";
                card.style.border = "1px solid #ddd";
                card.style.borderRadius = "8px";

                card.innerHTML = `

                    <strong>
                        ${escapeHTML(
                            admin.name || "Unnamed Admin"
                        )}
                    </strong>

                    <br>

                    <span style="color:#666;">
                        ${escapeHTML(
                            admin.email || "No email"
                        )}
                    </span>

                    <br><br>

                    <button
                        style="
                            background:#c62828;
                            color:white;
                        "
                        onclick="removeAdmin(
                            '${adminSnapshot.id}'
                        )">

                        Remove Admin Access

                    </button>

                `;

                container.appendChild(card);

            });

        }
    );
}

window.removeAdmin =
    async function(userId) {

        if (!confirm(
            "Are you sure you want to remove this user's admin access?"
        )) {
            return;
        }

        try {

            await updateDoc(
                doc(db, "users", userId),
                {
                    role: "user"
                }
            );

            alert(
                "Admin access removed successfully."
            );

        } catch (error) {

            console.error(error);

            alert(
                "Unable to remove admin access."
            );

        }

    };

