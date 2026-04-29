import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId } = await req.json();

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      if (userId) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { error } = await supabase
          .from("profiles")
          .update({ is_pro: true })
          .eq("id", userId);

        if (error) {
          console.error("Supabase profile update error:", error);
          // Still return success since payment went through, but log the error
        }
      }
      return NextResponse.json({ success: true, message: "Payment verified successfully" });
    } else {
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
    }
  } catch (err) {
    console.error("Razorpay Verify Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
