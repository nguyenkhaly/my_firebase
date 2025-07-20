// TODO: Replace with your Firebase config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.signInWithEmailAndPassword(email, password)
    .then(userCredential => {
      const uid = userCredential.user.uid;
      return db.collection("users").doc(uid).get();
    })
    .then(doc => {
      if (!doc.exists) throw new Error("User role not set.");
      const role = doc.data().role;
      if (role === "admin") {
        window.location.href = "admin.html";
      } else {
        window.location.href = "user.html";
      }
    })
    .catch(error => {
      document.getElementById("error").innerText = error.message;
    });
}

function uploadVideo() {
  const file = document.getElementById("videoFile").files[0];
  const title = document.getElementById("videoTitle").value;
  if (!file || !title) return alert("Please select a file and enter a title.");

  const storageRef = storage.ref("videos/" + file.name);
  storageRef.put(file)
    .then(snapshot => snapshot.ref.getDownloadURL())
    .then(url => {
      return db.collection("videos").add({
        title: title,
        url: url,
        uploadedAt: new Date()
      });
    })
    .then(() => {
      alert("Video uploaded successfully.");
      loadVideos();
    });
}

function deleteVideo(id, fileName) {
  db.collection("videos").doc(id).delete().then(() => {
    return storage.ref("videos/" + fileName).delete();
  }).then(() => {
    loadVideos();
  });
}

function loadVideos() {
  const listEl = document.getElementById("videoList");
  if (!listEl) return;
  listEl.innerHTML = "";

  db.collection("videos").orderBy("uploadedAt", "desc").get()
    .then(querySnapshot => {
      querySnapshot.forEach(doc => {
        const data = doc.data();
        const li = document.createElement("li");
        li.innerHTML = `${data.title}<br><video width="320" controls><source src="${data.url}" type="video/mp4"></video>`;
        
        if (window.location.pathname.includes("admin")) {
          const delBtn = document.createElement("button");
          delBtn.innerText = "Delete";
          delBtn.onclick = () => {
            const fileName = decodeURIComponent(data.url.split("/").pop().split("?")[0]);
            deleteVideo(doc.id, fileName);
          };
          li.appendChild(delBtn);
        }

        listEl.appendChild(li);
      });
    });
}

window.onload = loadVideos;
