const crypto = require("crypto");
const randomBytes = crypto.randomBytes(64).toString("hex");
console.log(randomBytes);
