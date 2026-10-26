# Future Enhancements — Mencia

This file documents features that have been temporarily removed or disabled.
Use the instructions here to re-enable them when ready.

---

## Razorpay Payment Integration

**Status:** DISABLED (commented out)
**Priority:** High — required for Pro plan monetization
**Estimated re-enable effort:** ~30 minutes

---

### What Razorpay was doing

Users could upgrade to a **Pro Plan (INR 699 / 90 days)** via Razorpay.
The full payment flow:
1. User clicks "Upgrade Now" on `/billing`
2. Client POSTs to `POST /api/billing/order` → server creates a Razorpay order
3. Razorpay checkout popup opens in browser (via `window.Razorpay`)
4. On payment success, Razorpay calls the `handler` callback with `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }`
5. Client POSTs those to `POST /api/billing/verify`
6. Server verifies HMAC signature, marks order as paid, sets user.plan="pro" + proExpiresAt = now+90days
7. Updated user object returned → client state updated → button shows "Active Plan"

---

### Environment Variables needed

#### Server/.env — add these:
```
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

#### Client/.env — add this:
```
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
```

> Note: Use rzp_test_ keys for dev/test. Switch to rzp_live_ for production.

---

### Files to re-enable (step by step)

---

#### STEP 1 — Server/Configs/razorpay.js

Uncomment the entire file:

```js
import Razorpay from "razorpay"
import dotenv from "dotenv"
dotenv.config()

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
```

---

#### STEP 2 — Server/Controllers/billing.controller.js

Replace file contents with:

```js
import { razorpay } from "../Configs/razorpay.js"
import Billing from "../Models/billing.model.js"
import crypto from "crypto"
import User from "../Models/user.model.js"

export const createOrder = async (req, res) => {
    try {
        const { plan } = req.body
        const userId = req.userId
        let amount = 0

        if (plan === "pro") {
            amount = 699
        }

        const order = await razorpay.orders.create({
            amount: amount * 100,
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        });

        await Billing.create({
            userId,
            amount,
            plan,
            orderId: order.id
        })

        return res.json({ success: true, order });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Order creation failed" });
    }
}


export const verifyBilling = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body
        const userId = req.userId

        const sign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest("hex")

        if (sign !== razorpay_signature) {
            return res.json({ success: false, message: "Payment verification failed" });
        }

        await Billing.findOneAndUpdate({ orderId: razorpay_order_id }, {
            paymentId: razorpay_payment_id,
            status: "paid"
        })

        const user = await User.findByIdAndUpdate(userId, {
            plan: "pro",
            proExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        }, { new: true })

        return res.json({ success: true, user })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Payment verification failed" });
    }
}
```

---

#### STEP 3 — Server/index.js

Uncomment these two lines:

```js
// Line ~10: uncomment import
import billingRouter from "./Routes/billing.route.js"

// Line ~41: uncomment route mount
app.use("/api/billing", privateCors, billingRouter)
```

---

#### STEP 4 — Client/src/pages/Billing.jsx

Replace the file with the full payment-enabled version:

```jsx
import axios from 'axios';
import React from 'react'
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { ServerUrl } from '../App';

function Billing({ user, setUser }) {
  const navigate = useNavigate()

  useEffect(() => {
    if (user && !user.isSetupComplete) {
      toast.error("Setup your assistant first");
      navigate("/builder");
    }
  }, [])

  const remainingMessages =
    Math.max(
      0,
      (user?.requestLimit || 0) -
      (user?.totalMessages || 0)
    );

  const remainingDays =
    user?.proExpiresAt
      ? Math.max(
        0,
        Math.ceil(
          (new Date(user.proExpiresAt) - new Date()) /
          (1000 * 60 * 60 * 24)
        )
      )
      : 0;

  const handlePay = async () => {
    try {
      const res = await axios.post(ServerUrl + "/api/billing/order", { plan: "pro" }, { withCredentials: true })

      const order = res.data.order

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Mencia",
        description: "Pro Plan",
        order_id: order.id,
        handler: async (response) => {
          const verifyRes = await axios.post(ServerUrl + "/api/billing/verify", response, { withCredentials: true })
          if (verifyRes.data.success) {
            toast.success("Payment successful")
            setUser(verifyRes.data.user)
          }
        },
        theme: { color: "#7c3aed" },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (error) {
      toast.error("Payment Failed")
      console.log(error);
    }
  }

  return (
    <div className='min-h-screen bg-[#f7f8fc] px-4 py-10'>

      <div className='max-w-5xl mx-auto'>

        <div className='mb-8'>
          <h2 className='text-3xl font-bold text-[#081028]'>
            Billing &amp; Subscription
          </h2>
          <p className='text-gray-500 mt-1'>Manage your AI assistant plan and usage.</p>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6'>

          <div className='bg-white rounded-3xl p-6 border border-gray-100 shadow-sm'>
            <p className='text-sm text-gray-400'>Current Plan</p>
            <h2 className='text-xl font-bold text-[#081028] mt-1 capitalize'>{user?.plan}</h2>
          </div>

          <div className='bg-white rounded-3xl p-6 border border-gray-100 shadow-sm'>
            <p className='text-sm text-gray-400'>Gemini Status</p>
            <h2 className={`text-xl font-bold mt-1 capitalize ${
              user?.geminiStatus === "active"
                ? "text-emerald-600"
                : user?.geminiStatus === "invalid"
                  ? "text-red-500"
                  : "text-amber-500"
            }`}>{user?.geminiStatus}</h2>
          </div>

          <div className='bg-white rounded-3xl p-6 border border-gray-100 shadow-sm'>
            <p className='text-sm text-gray-400'>{user?.plan === "free" ? "Messages Left" : "Plan Expiry"}</p>
            <h2 className='text-xl font-bold text-[#081028] mt-1 capitalize'>
              {user?.plan === "free" ? remainingMessages : `${remainingDays} Days`}
            </h2>
          </div>

        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mt-10'>

          {/* Free */}
          <div className='bg-white rounded-3xl p-8 border border-gray-100 shadow-sm'>
            <h2 className="text-2xl font-bold text-[#081028]">Free Plan</h2>
            <h3 className="text-5xl font-bold mt-5 text-[#081028]">₹0</h3>
            <ul className="mt-6 space-y-4 text-gray-600">
              <li>200 AI messages</li>
              <li>Voice assistant</li>
              <li>Navigation support</li>
              <li>Basic customization</li>
            </ul>
          </div>

          {/* Pro */}
          <div className='rounded-3xl p-8 bg-gradient-to-r from-purple-600 to-emerald-500 text-white shadow-lg'>
            <h2 className="text-2xl font-bold text-white">Pro Plan</h2>
            <h3 className="text-5xl font-bold mt-5 text-white">₹699</h3>
            <p className='mt-2 opacity-80'>3 Months Access</p>
            <ul className='mt-6 space-y-4 opacity-90'>
              <li>Unlimited AI messages</li>
              <li>Advanced AI assistant</li>
              <li>Priority performance</li>
              <li>Unlimited navigation</li>
              <li>Premium support</li>
            </ul>

            <button
              onClick={handlePay}
              disabled={user?.plan === "pro"}
              className={`mt-8 h-14 w-full rounded-2xl font-semibold transition ${
                user?.plan === "pro"
                  ? "bg-emerald-200 text-black cursor-default"
                  : "bg-white text-[#081028] cursor-pointer"
              }`}
            >
              {user?.plan === "pro" ? "Active Plan" : "Upgrade Now"}
            </button>
          </div>

        </div>

      </div>

    </div>
  )
}

export default Billing
```

---

#### STEP 5 — Client/src/App.jsx

Update the billing route to pass `setUser` prop back:

```jsx
<Route path='/billing' element={<Billing user={user} setUser={setUser}/>}/>
```

---

#### STEP 6 — Add Razorpay checkout script to Client/index.html

Inside the `<head>` tag, add:

```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

This loads `window.Razorpay` globally so the checkout popup works.

---

### Data Models (already in place — no changes needed)

#### Billing model (Server/Models/billing.model.js) — already exists, unchanged:
```js
{
  userId: ObjectId (ref User),
  amount: Number,
  plan: String,
  paymentId: String,
  orderId: String,
  status: enum["created", "paid", "failed"],  // default: "created"
  timestamps: true
}
```

#### User model plan fields (Server/Models/user.model.js) — already in schema:
```js
plan: enum["free", "pro"],        // default: "free"
requestLimit: Number,             // default: 200
proExpiresAt: Date,               // default: null
```

---

### Routes (Server/Routes/billing.route.js) — already in place, no changes needed:
```
POST /api/billing/order   → isAuth → createOrder
POST /api/billing/verify  → isAuth → verifyBilling
```

---

### Known bug to fix when re-enabling

File: `Server/Controllers/assistant.controller.js`, line 45

Current (broken):
```js
user.plan === "free"   // comparison — does nothing
```

Fix to:
```js
user.plan = "free"     // assignment — actually downgrades the plan
```

This bug means pro plan never downgrades after expiry. Fix this before re-enabling payments.

---

### Checklist for re-enabling Razorpay

- [ ] Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to Server/.env
- [ ] Add VITE_RAZORPAY_KEY_ID to Client/.env
- [ ] Uncomment Server/Configs/razorpay.js (Step 1)
- [ ] Restore Server/Controllers/billing.controller.js (Step 2)
- [ ] Uncomment billingRouter in Server/index.js (Step 3)
- [ ] Restore Client/src/pages/Billing.jsx with handlePay (Step 4)
- [ ] Restore setUser prop on Billing route in App.jsx (Step 5)
- [ ] Add Razorpay checkout.js script to Client/index.html (Step 6)
- [ ] Fix pro plan downgrade bug in assistant.controller.js
- [ ] Test with Razorpay test keys before going live

