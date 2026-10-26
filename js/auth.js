(() => {
  "use strict";
  const DEMO_PASSWORD = "demo123";
  const ADMIN = { id: "ADMIN", name: "Demo Administrator", role: "admin", email: "admin@demo.edu" };
  function signIn(data, role, identifier, password) {
    if (password !== DEMO_PASSWORD) throw new Error("Incorrect demo password.");
    let user;
    if (role === "admin") {
      if (identifier.trim().toLowerCase() !== ADMIN.email) throw new Error("Use the sample admin email shown below.");
      user = ADMIN;
    } else {
      user = data.students.find((student) => student.id.toLowerCase() === identifier.trim().toLowerCase());
      if (!user) throw new Error("Student ID not found. Try STU001, STU002, STU003 or STU004.");
      user = { id: user.id, name: user.name, role: "student", email: user.email };
    }
    data.currentUser = user;
    window.AttendanceDemo.Storage.write(data);
    return user;
  }
  function signOut(data) {
    data.currentUser = null;
    window.AttendanceDemo.Storage.write(data);
  }
  window.AttendanceDemo.Auth = { signIn, signOut };
})();
