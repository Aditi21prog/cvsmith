import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET
});

export default async function handler(req, res) {

  const { sessionId } = req.body;

  try {

    const order = await razorpay.orders.create({
      amount: 2100, // ₹21
      currency: "INR",
      receipt: sessionId
    });

    res.status(200).json(order);

  } catch (err) {

    res.status(500).json({
      error: "Order creation failed"
    });

  }

}