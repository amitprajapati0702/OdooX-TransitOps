import bcrypt from "bcrypt";

const password = "passAdmin@123";
const hash = "$2b$10$4qeOTVJPfU7aRGnutHf1oOFEZRpu9YoZyzPlwqh5F2bp/5L/viFtq";

const isMatch = await bcrypt.compare(password, hash);

console.log(isMatch);