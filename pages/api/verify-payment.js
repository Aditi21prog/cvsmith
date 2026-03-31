import crypto from "crypto";

export default function handler(req, res) {

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    sessionId,
    type
  } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature === razorpay_signature) {

    return res.json({
      success: true,
      downloadUrl:
        `/api/payment-success?sessionId=${sessionId}&type=${type}`
    });

  } else {

    return res.status(400).json({
      error: "Payment verification failed"
    });

  }

}