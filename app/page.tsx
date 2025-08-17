'use client';
import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    redirect('/dashboard');
  });
  return (
    <div>
      <h1>Home</h1>
    </div>
  );
}
