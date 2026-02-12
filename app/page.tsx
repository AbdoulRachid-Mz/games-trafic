import HomePage from "@/components/pages/home/home-page";

export const revalidate = 60; // 60 secondes

export default function Page() {
  return <HomePage />;
}


// import { ComponentExample } from "@/components/component-example";

// export default function Page() {
// return <ComponentExample />;
// }