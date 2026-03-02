const { z } = require('zod')

const userZodSchema = z.object({
 username: z.string().min(3, "Username must be at least 3 characters"),

  email: z.email("Invalid email format"),

  password: z.string().min(5, "Password must be at least 5 characters"),

  role: z.enum(["customer", "seller"]).default("customer"),

  wallet: z.number().min(0).default(1000),
})

module.exports = userZodSchema