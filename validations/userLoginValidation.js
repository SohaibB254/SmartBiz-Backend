const { z } = require('zod')

const userLoginSchema = z.object({
    email: z.email("Invalid email format"),
   password: z.string().min(5, "Password must be at least 5 characters"),
})

module.exports = userLoginSchema