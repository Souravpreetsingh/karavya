'use strict';

const { z } = require('zod');

const email = z.string().trim().email('A valid email is required').max(254).transform((v) => v.toLowerCase());
const phone = z
  .string()
  .trim()
  .max(30, 'Phone number is too long')
  .regex(/^\+?[0-9\s().-]*$/, 'Enter a valid WhatsApp number')
  .optional()
  .default('');

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/\d/, 'Password must contain a number');

const guestCartItem = z.object({
  productId: z.string().uuid('Invalid product id'),
  size: z.string().max(20).optional().default(''),
  color: z.string().max(40).optional().default(''),
  quantity: z.number().int().min(1).max(10).optional().default(1),
});

const guestWishlist = z.array(z.string().uuid('Invalid product id')).max(50);

const registerSchema = z
  .object({
    authMethod: z.enum(['email', 'whatsapp']).optional().default('email'),
    firstName: z.string().min(1, 'First name is required').max(60),
    lastName: z.string().max(60).optional().default(''),
    email: email.optional(),
    password,
    phone,
    guestCart: z.array(guestCartItem).max(20).optional().default([]),
    guestWishlist: guestWishlist.optional().default([]),
  })
  .superRefine((data, ctx) => {
    if (data.authMethod === 'whatsapp') {
      const digits = String(data.phone || '').replace(/\D/g, '');
      if (digits.length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['phone'],
          message: 'A valid WhatsApp number is required',
        });
      }
      return;
    }

    if (!data.email) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['email'],
        message: 'A valid email is required',
      });
    }
  });

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email or WhatsApp number is required').max(254),
  password: z.string().min(1, 'Password is required').max(128),
  guestCart: z.array(guestCartItem).max(20).optional().default([]),
  guestWishlist: guestWishlist.optional().default([]),
});

const forgotPasswordSchema = z.object({ email });

const resetPasswordSchema = z.object({
  token: z.string().min(20).max(128),
  newPassword: password,
});

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(60).optional(),
  lastName: z.string().max(60).optional(),
  phone: z.string().max(20).optional(),
  preferredSize: z.string().max(20).optional(),
  preferredFit: z.string().max(60).optional(),
  styleProfile: z.record(z.string(), z.unknown()).optional(),
});

const idParam = z.object({ id: z.string().uuid('Invalid id') });

const cartItemSchema = z.object({
  productId: z.string().uuid('Invalid product id'),
  size: z.string().max(20).optional().default(''),
  color: z.string().max(40).optional().default(''),
  quantity: z.number().int().min(1).max(10).optional().default(1),
});

const cartItemUpdateSchema = z.object({ quantity: z.number().int().min(1).max(10) });

const wishlistItemSchema = z.object({ productId: z.string().uuid('Invalid product id') });

const addressSchema = z.object({
  label: z.string().max(40).optional(),
  fullName: z.string().min(1).max(80),
  phone: z.string().min(6).max(20),
  line1: z.string().min(1).max(120),
  line2: z.string().max(120).optional().default(''),
  city: z.string().min(1).max(60),
  state: z.string().min(1).max(60),
  pincode: z.string().min(3).max(12),
  country: z.string().max(40).optional(),
  isDefault: z.boolean().optional(),
});

const styleProfileSchema = z.object({
  answers: z.record(z.string(), z.string().max(40)),
  archetype: z.string().max(40).optional(),
  quizVersion: z.string().max(20).optional(),
});

const fitProfileSchema = z.object({
  heightCm: z.number().min(50).max(250).nullable().optional(),
  weightKg: z.number().min(20).max(300).nullable().optional(),
  sizePreference: z.string().max(20).optional().default(''),
  measurements: z.record(z.string(), z.number()).optional().default({}),
});

const giftPreferenceSchema = z.object({
  occasion: z.string().max(80).optional().default(''),
  recipientType: z.string().max(80).optional().default(''),
  budgetMin: z.number().min(0).max(1000000).nullable().optional(),
  budgetMax: z.number().min(0).max(1000000).nullable().optional(),
  stylePreferences: z.array(z.string().max(40)).max(10).optional().default([]),
});

const orderCreateSchema = z.object({
  shippingAddress: z.object({
    fullName: z.string().min(1).max(80),
    phone: z.string().min(6).max(20),
    line1: z.string().min(1).max(120),
    line2: z.string().max(120).optional().default(''),
    city: z.string().min(1).max(60),
    state: z.string().min(1).max(60),
    pincode: z.string().min(3).max(12),
    country: z.string().max(40).optional().default('India'),
  }),
  billingAddress: z.any().optional(),
  paymentReference: z.string().max(120).optional().default(''),
});

const orderStatusSchema = z.object({
  status: z.string().max(40),
  paymentStatus: z.string().max(40).optional(),
  paymentReference: z.string().max(120).optional(),
});

const returnCreateSchema = z.object({
  orderId: z.string().uuid('Invalid order id'),
  reason: z.string().max(500).optional().default(''),
  items: z
    .array(z.object({ orderItemId: z.string().uuid(), quantity: z.number().int().min(1).max(10) }))
    .min(1)
    .max(20),
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  idParam,
  cartItemSchema,
  cartItemUpdateSchema,
  wishlistItemSchema,
  addressSchema,
  styleProfileSchema,
  fitProfileSchema,
  giftPreferenceSchema,
  orderCreateSchema,
  orderStatusSchema,
  returnCreateSchema,
};
