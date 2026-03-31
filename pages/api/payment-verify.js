import crypto from "crypto";

const used = new Set();

export function isValidToken(token) {
  return token && token.startsWith("PAY_");
}

export default function handler(req,res){
  const { utr } = req.body;

  if(!utr || utr.length < 8) return res.status(400).json({error:"Invalid UTR"});

  if(used.has(utr)) return res.status(400).json({error:"UTR already used"});

  used.add(utr);

  const token = "PAY_" + crypto.randomBytes(12).toString("hex");
  res.json({success:true, token});
}
