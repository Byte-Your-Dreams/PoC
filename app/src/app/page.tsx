"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

const Chat: React.FC = () => {
  const router = useRouter();
  useEffect(() => {
  router.push("/default");
  }, []);

  return <div>loading...</div>;
};

export default Chat;
