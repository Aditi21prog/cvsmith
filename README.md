# Finance Resume Tailor — MVP


## Setup
1. Copy files into project folder
2. `npm install`
3. Add environment variable `OPENAI_API_KEY` locally (or set in Vercel)
4. `npm run dev`


## Notes
- This is an MVP. The PDF/DOCX upload reads files as text via FileReader; for robust PDF parsing, add pdf-parse on the server or a client PDF parser.
- In `pages/api/tailor.js` replace the OpenAI endpoint/model with your subscription model/version.
- Deployment: push to GitHub and import repository in Vercel. Add `OPENAI_API_KEY` in Project Settings -> Environment Variables.


## Next steps
- Add payment (Razorpay/Stripe)
- Add rate limiting and usage tracking
- Improve resume parsing for PDF/DOCX
- Add ATS scoring and deal/audit extraction