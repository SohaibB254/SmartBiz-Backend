const { z } = require('zod')

// New business Creation schema
const businessZodSchema = z.object({
     title: z.string().min(3,"Title must be atleast 3 characters"),
     ownerName: z.string().min(3,"Owner name must be atleast 3 characters"),
     businessType: z.enum(['Product Based',"Service Based"]),
     description: z.string().max(10000,"Description cannot be longer than 10000 characters"),
     isActive: z.enum(true,false).default(true),

})

//Update business Schema optionally
const businessUpdateZodSchema = z.object({
     title: z.string().optional(),
     ownerName: z.string().optional(),
     description: z.string().optional(),
     isActive: z.enum(true,false).optional(),

})

module.exports =
{ businessZodSchema
  , businessUpdateZodSchema
}
