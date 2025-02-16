import Head from "next/head";

import FlowBoard from "@/components/FlowBoard";

export async function getServerSideProps() {
  return { props: { apiKey: process.env.OPENAI_API_KEY } };
}

export default function Home({ apiKey }) {
  return (
    <>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <FlowBoard apiKey={apiKey} />
      </main>
    </>
  );
}
