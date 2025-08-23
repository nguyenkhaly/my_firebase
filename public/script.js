// Cấu hình Firebase của bạn
const firebaseConfig = {
apiKey: "AIzaSyCgr5cYNEcVIZj95yE3CdQwCqEcYXQRP-A",
  authDomain: "ip-tv-9568e.firebaseapp.com",
  projectId: "ip-tv-9568e",
  storageBucket: "ip-tv-9568e.appspot.com",
  messagingSenderId: "872803283406",
  appId: "1:872803283406:web:09e602f4d7b98b2fa8fb9f"
};

// Khởi tạo Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// === ĐĂNG NHẬP ===
function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const uid = userCredential.user.uid;
      return db.collection("users").doc(uid).get();
    })
    .then((doc) => {
      if (doc.exists) {
        const userData = doc.data();
        if (userData.role === "admin") {
          window.location.href = "admin.html";
        } else {
          window.location.href = "user.html";
        }
      } else {
        throw new Error("Tài khoản không có dữ liệu người dùng.");
      }
    })
    .catch((error) => {
      document.getElementById("error").innerText = error.message;
    });
}

// === TẢI LÊN VIDEO (Admin) ===
function uploadVideo() {
  const file = document.getElementById("videoFile").files[0];
  const title = document.getElementById("videoTitle").value;

  if (!file || !title) {
    alert("Vui lòng chọn file và nhập tiêu đề.");
    return;
  }

  const fileName = `${Date.now()}_${file.name}`;
  const storageRef = storage.ref("videos/" + fileName);

  storageRef.put(file)
    .then((snapshot) => snapshot.ref.getDownloadURL())
    .then((url) => {
      return db.collection("videos").add({
        title: title,
        url: url,
        uploadedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    })
    .then(() => {
      alert("Tải video lên thành công.");
      loadVideos();
    })
    .catch((error) => {
      console.error("Lỗi khi tải video:", error);
      alert("Lỗi khi tải video: " + error.message);
    });
}

// === XOÁ VIDEO (Admin) ===
function deleteVideo(id, fileName) {
  if (!confirm("Bạn có chắc chắn muốn xoá video này?")) return;

  db.collection("videos").doc(id).delete()
    .then(() => storage.ref("videos/" + fileName).delete())
    .then(() => {
      alert("Đã xoá video.");
      loadVideos();
    })
    .catch((error) => {
      console.error("Lỗi khi xoá video:", error);
      alert("Lỗi khi xoá video: " + error.message);
    });
}

// === LOAD VIDEO (Tất cả người dùng) ===
function loadVideos() {
  const listEl = document.getElementById("videoList");
  if (!listEl) return;

  listEl.innerHTML = "";

  db.collection("videos").orderBy("uploadedAt", "desc").get()
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const li = document.createElement("li");

        li.innerHTML = `
          <strong>${data.title}</strong><br>
          <video width="320" controls>
            <source src="${data.url}" type="video/mp4">
          </video><br>
        `;

        // Nếu đang ở trang admin, hiển thị nút xoá
        if (window.location.pathname.includes("admin")) {
          const delBtn = document.createElement("button");
          delBtn.innerText = "Xoá";
          delBtn.onclick = () => {
            const fileName = decodeURIComponent(data.url).split("/videos%2F")[1].split("?")[0];
            deleteVideo(doc.id, fileName);
          };
          li.appendChild(delBtn);
        }

        listEl.appendChild(li);
      });
    })
    .catch((error) => {
      console.error("Lỗi khi tải danh sách video:", error);
    });
}

// Tự động load video nếu có phần tử danh sách trên trang
window.onload = loadVideos;
