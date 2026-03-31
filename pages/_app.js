import '../styles/globals.css'
import Head from 'next/head'
import Script from 'next/script'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Finance Resume Tailor — MVP</title>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Script src="https://checkout.razorpay.com/v1/checkout.js" />

      <Component {...pageProps} />
    </>
  )
}