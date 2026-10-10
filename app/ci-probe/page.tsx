import { useState } from "react";

export default function Page() {
  const [value] = useState(0);
  return <p>{value}</p>;
}
