const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('123', 10);
console.log(hash); // Use this output as the password in your DB