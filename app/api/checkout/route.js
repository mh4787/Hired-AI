import Razorpay from "razorpay";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: "Razorpay keys not configured" }, { status: 500 });
    }

    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: 149 * 100, // Rs 149 in paise
      currency: "INR",
      receipt: "receipt_" + Math.random().toString(36).substring(7),
    };
    
    const order = await razorpay.orders.create(options);
    return NextResponse.json(order);
  } catch (err) {
    console.error("Razorpay Checkout Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
