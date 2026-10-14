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
    doc,
    getDoc,
    updateDoc
}
from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";


/* =====================================
   FIREBASE CONFIG
===================================== */

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


/* =====================================
   ELEMENTS
===================================== */

const profileName =
    document.getElementById("profileName");

const nameInput =
    document.getElementById("name");

const emailElement =
    document.getElementById("email");

const roleElement =
    document.getElementById("role");

const createdAtElement =
    document.getElementById("createdAt");

const avatar =
    document.getElementById("avatar");

const message =
    document.getElementById("message");

const profileForm =
    document.getElementById("profileForm");


let currentUser = null;


/* =====================================
   CHECK LOGIN
===================================== */

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "login.html";

            return;
        }


        currentUser = user;


        await loadProfile(user.uid);

    }
);


/* =====================================
   LOAD PROFILE
===================================== */

async function loadProfile(userId) {

    try {

        const userRef =
            doc(
                db,
                "users",
                userId
            );


        const userSnapshot =
            await getDoc(userRef);


        if (!userSnapshot.exists()) {

            message.textContent =
                "Profile not found.";

            message.style.color =
                "red";

            return;
        }


        const userData =
            userSnapshot.data();


        const name =
            userData.name ||
            currentUser.displayName ||
            "Student";


        profileName.textContent =
            name;


        nameInput.value =
            name;


        emailElement.textContent =
            userData.email ||
            currentUser.email ||
            "Not available";


        roleElement.textContent =
            userData.role ||
            "user";


        /* ================================
           ACCOUNT CREATION DATE
        ================================= */

        if (userData.createdAt) {

            const date =
                userData.createdAt.toDate();

            createdAtElement.textContent =
                date.toLocaleDateString(
                    "en-NG",
                    {
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                    }
                );

        } else {

            createdAtElement.textContent =
                "Not available";

        }


        /* ================================
           AVATAR
        ================================= */

        avatar.textContent =
            name
                .charAt(0)
                .toUpperCase();


    } catch (error) {

        console.error(error);

        message.textContent =
            "Unable to load your profile.";

        message.style.color =
            "red";

    }

}


/* =====================================
   UPDATE PROFILE
===================================== */

profileForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        if (!currentUser) {
            return;
        }


        const newName =
            nameInput.value.trim();


        if (!newName) {

            message.textContent =
                "Please enter your name.";

            message.style.color =
                "red";

            return;

        }


        try {

            const userRef =
                doc(
                    db,
                    "users",
                    currentUser.uid
                );


            await updateDoc(
                userRef,
                {
                    name: newName
                }
            );


            profileName.textContent =
                newName;


            avatar.textContent =
                newName
                    .charAt(0)
                    .toUpperCase();


            message.textContent =
                "Profile updated successfully!";

            message.style.color =
                "green";


        } catch (error) {

            console.error(error);

            message.textContent =
                "Unable to update profile.";

            message.style.color =
                "red";

        }

    }
);


/* =====================================
   DASHBOARD
===================================== */

document
    .getElementById("dashboardBtn")
    .addEventListener(
        "click",
        () => {

            window.location.href =
                "dashboard.html";

        }
    );


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

