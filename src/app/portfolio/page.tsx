"use client";
import dynamic from "next/dynamic";

const ClientPage = dynamic(() => import("./client"), {
  ssr: false,
});

export default function Page() {
  return <ClientPage />;
}
