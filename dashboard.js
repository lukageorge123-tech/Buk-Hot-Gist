import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    signOut
}
from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    query,
    where,
    onSnapshot
}
from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";


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


const userName =
    document.getElementById("userName");

const userEmail =
    document.getElementById("userEmail");

const postsContainer =
    document.getElementById("postsContainer");


/* =====================================
   CHECK LOGIN
===================================== */

onAuthStateChanged(
    auth,
    (user) => {

        if (!user) {

            window.location.href =
                "login.html";

            return;
        }


        userName.textContent =
            user.displayName || "Student";

        userEmail.textContent =
            user.email || "";


        loadMyPosts(user.uid);

    }
);


/* =====================================
   LOAD MY POSTS
===================================== */

function loadMyPosts(userId) {

    const postsQuery = query(
        collection(db, "posts"),
        where("authorId", "==", userId)
    );


    onSnapshot(
        postsQuery,
        (snapshot) => {

            const total =
                snapshot.size;

            let approved = 0;
            let pending = 0;


            postsContainer.innerHTML = "";


            if (snapshot.empty) {

                postsContainer.innerHTML = `
                    <div class="post-card">
                        <p>
                            You haven't submitted
                            any posts yet.
                        </p>
                    </div>
                `;

            }


            snapshot.forEach(
                (postSnapshot) => {

                    const post =
                        postSnapshot.data();


                    if (
                        post.status ===
                        "approved"
                    ) {
                        approved++;
                    }


                    if (
                        post.status ===
                        "pending"
                    ) {
                        pending++;
                    }


                    const card =
                        document.createElement(
                            "div"
                        );

                    card.className =
                        "post-card";


                    const status =
                        post.status || "pending";


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
                                post.category ||
                                "General"
                            )}

                        </div>

                        <br>

                        <span class="status ${status}">

                            ${status.toUpperCase()}

                        </span>

                    `;


                    postsContainer.appendChild(
                        card
                    );

                }
            );


            document.getElementById(
                "totalPosts"
            ).textContent = total;


            document.getElementById(
                "approvedPosts"
            ).textContent = approved;


            document.getElementById(
                "pendingPosts"
            ).textContent = pending;

        },

        (error) => {

            console.error(error);

            postsContainer.innerHTML = `
                <div class="post-card">
                    <p>
                        Unable to load your posts.
                    </p>
                </div>
            `;

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
   SECURITY
===================================== */

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value || "";

    return div.innerHTML;

}

